"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import {
  warehouseApi,
  type CarrierReceipt,
  type CatalogItem,
  type PurchaseOrder,
} from "@/lib/api/warehouse";
import {
  button,
  Empty,
  message,
  Notice,
  panel,
  subtleButton,
  useRemote,
} from "./Ui";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { PoDetails, PoForm } from "./receive/ReceivePo";
import { SupplierForm, SupplierRow } from "./receive/ReceiveSupplier";
import { CarrierDetails, CarrierForm } from "./receive/ReceiveCarrier";
import { CountForm } from "./receive/ReceiveCount";

type Step = "po" | "supplier" | "carrier" | "count";
const steps: Array<[Step, string]> = [
  ["po", "รายการสั่งซื้อ"],
  ["supplier", "เอกสารผู้ขาย"],
  ["carrier", "เอกสารขนส่งและรับของ"],
  ["count", "นับและลงสต๊อก"],
];

export default function ReceiveScreen() {
  const account = useOptionalWarehouseAccount();
  const [step, setStep] = useState<Step>("po");
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const me = account?.me;
      if (!me) throw new Error("ยังไม่ได้โหลดข้อมูลบัญชี");
      const activeStep: Step = me.role === "EMPLOYEE" ? "carrier" : step;
      const emptyData = {
        step: activeStep,
        me,
        purchaseOrders: [] as Awaited<
          ReturnType<typeof warehouseApi.purchaseOrders>
        >,
        carriers: [] as Awaited<
          ReturnType<typeof warehouseApi.carrierReceipts>
        >,
        branches: [] as CatalogItem[],
        suppliers: [] as CatalogItem[],
        warehouses: [] as CatalogItem[],
        ceos: [] as Awaited<ReturnType<typeof warehouseApi.ceos>>,
        supplierReceipts: [] as Awaited<
          ReturnType<typeof warehouseApi.supplierReceipts>
        >,
        goodsReceipts: [] as Awaited<
          ReturnType<typeof warehouseApi.goodsReceipts>
        >,
      };

      if (activeStep === "po") {
        const [purchaseOrders, suppliers, ceos] = await Promise.all([
          warehouseApi.purchaseOrders(signal),
          warehouseApi.catalog("suppliers", signal),
          warehouseApi.ceos(signal),
        ]);
        return { ...emptyData, purchaseOrders, suppliers, ceos };
      }

      if (activeStep === "supplier") {
        const [purchaseOrders, supplierReceipts] = await Promise.all([
          warehouseApi.purchaseOrders(signal),
          warehouseApi.supplierReceipts(signal),
        ]);
        return { ...emptyData, purchaseOrders, supplierReceipts };
      }

      if (activeStep === "carrier") {
        const [purchaseOrders, carriers, branches] = await Promise.all([
          warehouseApi.purchaseOrders(signal),
          warehouseApi.carrierReceipts(signal),
          warehouseApi.catalog("branches", signal),
        ]);
        return { ...emptyData, purchaseOrders, carriers, branches };
      }

      const [carriers, goodsReceipts, warehouses] = await Promise.all([
        warehouseApi.carrierReceipts(signal),
        warehouseApi.goodsReceipts(signal),
        warehouseApi.catalog("warehouses", signal),
      ]);
      return { ...emptyData, carriers, goodsReceipts, warehouses };
    },
    [step, account?.me],
  );
  const { data, loading, error, refresh } = useRemote(load, {
    enabled: !!account?.me,
  });
  const activeStep = data?.me.role === "EMPLOYEE" ? "carrier" : step;
  const activeData = data?.step === activeStep ? data : null;
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [carrier, setCarrier] = useState<CarrierReceipt | null>(null);
  useEffect(() => {
    if (!selectedPoId) return;
    const controller = new AbortController();
    void warehouseApi
      .purchaseOrder(selectedPoId, controller.signal)
      .then(setPo)
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause));
      });
    return () => controller.abort();
  }, [selectedPoId]);
  useEffect(() => {
    if (!selectedCarrierId) return;
    const controller = new AbortController();
    void warehouseApi
      .carrierReceipt(selectedCarrierId, controller.signal)
      .then(setCarrier)
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause));
      });
    return () => controller.abort();
  }, [selectedCarrierId]);
  const reload = async () => {
    await refresh();
    if (activeStep === "po" && selectedPoId)
      setPo(await warehouseApi.purchaseOrder(selectedPoId));
    if (activeStep === "carrier" && selectedCarrierId)
      setCarrier(await warehouseApi.carrierReceipt(selectedCarrierId));
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    setNotice(null);
    try {
      const result = await action();
      const warnings =
        result &&
        typeof result === "object" &&
        "warnings" in result &&
        Array.isArray(result.warnings)
          ? result.warnings
          : [];
      await reload();
      setNotice(success + (warnings.length ? ` · ${warnings.join(", ")}` : ""));
    } catch (cause) {
      setFailure(message(cause));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const countedCarrierIds = new Set(
    activeData?.goodsReceipts.map((receipt) => receipt.carrier_receipt_id) ??
      [],
  );
  return (
    <WarehousePageTemplate
      titleEn="Receiving"
      titleTh="สั่งสินค้าและตรวจรับ"
      routePath="/warehouse/receive"
      iconName="inbound"
    >
      <div className="flex flex-wrap gap-2">
        {steps
          .filter(([key]) => data?.me.role !== "EMPLOYEE" || key === "carrier")
          .map(([key, label]) => (
            <button
              key={key}
              className={activeStep === key ? button : subtleButton}
              onClick={() => setStep(key)}
            >
              {label}
            </button>
          ))}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      {(loading || (!activeData && !error)) && <p>กำลังโหลดข้อมูล...</p>}
      {busy && <Notice>กำลังบันทึกข้อมูล...</Notice>}

      {activeData && (
        <div
          className={busy ? "pointer-events-none opacity-60" : "contents"}
          aria-busy={busy}
        >
          {activeStep === "po" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <section className={panel}>
                <h2 className="mb-4 text-lg font-bold">PO ที่บันทึกแล้ว</h2>
                {activeData.purchaseOrders.length ? (
                  <div className="space-y-2">
                    {activeData.purchaseOrders.map((item) => (
                      <button
                        key={item.id}
                        className={`flex w-full flex-wrap justify-between gap-3 rounded-xl border p-3 text-left text-sm ${selectedPoId === item.id ? "border-indigo-500" : "border-slate-200 dark:border-white/10"}`}
                        onClick={() => {
                          setPo(null);
                          setSelectedPoId(item.id);
                        }}
                      >
                        <span>
                          <strong>{item.record_no}</strong> ·{" "}
                          {item.supplier_name}
                        </span>
                        <span>
                          {item.closed_at
                            ? "ปิดแล้ว"
                            : `${item.carrier_receipt_count ?? 0} ใบขนส่ง`}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty text="ยังไม่มี PO" />
                )}
                {po && (
                  <PoDetails
                    key={po.id}
                    po={po}
                    canClose={["ADMIN", "CEO", "MANAGER"].includes(
                      activeData.me.role,
                    )}
                    onEdit={(body) =>
                      run(
                        () => warehouseApi.updatePurchaseOrder(po.id, body),
                        "แก้ไข PO แล้ว",
                      )
                    }
                    onClose={() =>
                      run(
                        () => warehouseApi.closePurchaseOrder(po.id),
                        "ปิด PO แล้ว",
                      )
                    }
                  />
                )}
              </section>
              <PoForm
                suppliers={activeData.suppliers}
                ceos={activeData.ceos}
                onSave={(body) =>
                  run(
                    () => warehouseApi.createPurchaseOrder(body),
                    "บันทึก PO แล้ว",
                  )
                }
              />
            </div>
          )}

          {activeStep === "supplier" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <section className={panel}>
                <h2 className="mb-4 text-lg font-bold">เอกสารผู้ขาย</h2>
                {activeData.supplierReceipts.length ? (
                  activeData.supplierReceipts.map((item) => (
                    <SupplierRow key={item.id} item={item} />
                  ))
                ) : (
                  <Empty text="ยังไม่มีเอกสารผู้ขาย" />
                )}
              </section>
              <SupplierForm
                orders={activeData.purchaseOrders}
                selectedPoId={selectedPoId}
                onSave={(body) =>
                  run(
                    () => warehouseApi.createSupplierReceipt(body),
                    "บันทึกเอกสารผู้ขายแล้ว",
                  )
                }
              />
            </div>
          )}

          {activeStep === "carrier" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <section className={panel}>
                <h2 className="mb-4 text-lg font-bold">
                  ใบขนส่งและสถานะรับจากขนส่ง
                </h2>
                {activeData.carriers.length ? (
                  <div className="space-y-2">
                    {activeData.carriers.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full rounded-xl border p-3 text-left text-sm ${selectedCarrierId === item.id ? "border-indigo-500" : "border-slate-200 dark:border-white/10"}`}
                        onClick={() => {
                          setCarrier(null);
                          setSelectedCarrierId(item.id);
                        }}
                      >
                        <strong>{item.record_no}</strong> ·{" "}
                        {item.purchase_order_no} ·{" "}
                        {item.carrier_name ?? "ไม่ระบุขนส่ง"}
                        <span className="ml-2 text-slate-500">
                          {item.received_at ? "รับของแล้ว" : "รอรับของ"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty text="ยังไม่มีใบขนส่ง" />
                )}
                {carrier && (
                  <CarrierDetails
                    carrier={carrier}
                    branches={activeData.branches}
                    onConfirm={(body) =>
                      run(
                        () => warehouseApi.confirmDelivery(carrier.id, body),
                        "ยืนยันรับจากขนส่งแล้ว ยังไม่เพิ่มสต๊อก",
                      )
                    }
                  />
                )}
              </section>
              <CarrierForm
                orders={activeData.purchaseOrders}
                onSave={(body) =>
                  run(
                    () => warehouseApi.createCarrierReceipt(body),
                    "บันทึกใบขนส่งแล้ว",
                  )
                }
              />
            </div>
          )}

          {activeStep === "count" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
              <section className={panel}>
                <h2 className="mb-4 text-lg font-bold">ใบตรวจรับ</h2>
                {activeData.goodsReceipts.length ? (
                  <div className="space-y-2">
                    {activeData.goodsReceipts.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10"
                      >
                        <div>
                          <strong>{item.record_no}</strong> ·{" "}
                          {item.carrier_receipt_no}
                          <p className="text-slate-500">
                            {item.branch_name} · {item.warehouse_name} ·{" "}
                            {item.posted_at ? "ลงสต๊อกแล้ว" : "รอลงสต๊อก"}
                          </p>
                        </div>
                        {!item.posted_at && (
                          <button
                            className={button}
                            onClick={() =>
                              run(
                                () => warehouseApi.postGoodsReceipt(item.id),
                                "เพิ่มเฉพาะสินค้าดีเข้าสต๊อกแล้ว",
                              )
                            }
                          >
                            ลงสต๊อก
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="ยังไม่มีใบตรวจรับ" />
                )}
              </section>
              <CountForm
                carriers={activeData.carriers.filter(
                  (item) => !countedCarrierIds.has(item.id),
                )}
                warehouses={activeData.warehouses}
                onSave={(body) =>
                  run(
                    () => warehouseApi.createGoodsReceipt(body),
                    "บันทึกผลนับแล้ว รอลงสต๊อก",
                  )
                }
              />
            </div>
          )}
        </div>
      )}
    </WarehousePageTemplate>
  );
}
