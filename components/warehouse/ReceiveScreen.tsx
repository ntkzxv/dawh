"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import {
  warehouseApi,
  type ApiListPage,
  type CarrierReceipt,
  type CatalogItem,
  type GoodsReceipt,
  type Me,
  type PurchaseOrder,
  type SupplierReceipt,
} from "@/lib/api/warehouse";
import type { ApiPage } from "@/lib/api/client";
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
type CursorResource = "purchaseOrders" | "supplierReceipts" | "carriers" | "goodsReceipts";
type ReceiveData = {
  step: Step;
  me: Me;
  purchaseOrders: PurchaseOrder[];
  carriers: CarrierReceipt[];
  branches: CatalogItem[];
  suppliers: CatalogItem[];
  warehouses: CatalogItem[];
  ceos: Array<{ id: number; name: string }>;
  supplierReceipts: SupplierReceipt[];
  goodsReceipts: GoodsReceipt[];
  pages: Partial<Record<CursorResource, ApiPage>>;
};
type ReceiveReferences = {
  step: Step;
  suppliers?: CatalogItem[];
  ceos?: Array<{ id: number; name: string }>;
  branches?: CatalogItem[];
  warehouses?: CatalogItem[];
};
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
  const [loadingMore, setLoadingMore] = useState<Set<CursorResource>>(new Set());
  const pageControllersRef = useRef(new Map<CursorResource, AbortController>());
  useEffect(() => () => {
    for (const controller of pageControllersRef.current.values()) controller.abort();
    pageControllersRef.current.clear();
  }, [step]);
  const load = useCallback(
    async (signal: AbortSignal): Promise<ReceiveData> => {
      const me = account?.me;
      if (!me) throw new Error("ยังไม่ได้โหลดข้อมูลบัญชี");
      const activeStep: Step = me.role === "EMPLOYEE" ? "carrier" : step;
      const emptyData: ReceiveData = {
        step: activeStep,
        me,
        purchaseOrders: [],
        carriers: [],
        branches: [] as CatalogItem[],
        suppliers: [] as CatalogItem[],
        warehouses: [] as CatalogItem[],
        ceos: [],
        supplierReceipts: [],
        goodsReceipts: [],
        pages: {},
      };

      if (activeStep === "po") {
        const ordersPage = await warehouseApi.purchaseOrdersPage(null, signal);
        return { ...emptyData, purchaseOrders: ordersPage.items, pages: { purchaseOrders: ordersPage.page } };
      }

      if (activeStep === "supplier") {
        const [ordersPage, receiptsPage] = await Promise.all([
          warehouseApi.purchaseOrdersPage(null, signal),
          warehouseApi.supplierReceiptsPage(null, signal),
        ]);
        return { ...emptyData, purchaseOrders: ordersPage.items, supplierReceipts: receiptsPage.items, pages: { purchaseOrders: ordersPage.page, supplierReceipts: receiptsPage.page } };
      }

      if (activeStep === "carrier") {
        const [ordersPage, carriersPage] = await Promise.all([
          warehouseApi.purchaseOrdersPage(null, signal),
          warehouseApi.carrierReceiptsPage(null, signal),
        ]);
        return { ...emptyData, purchaseOrders: ordersPage.items, carriers: carriersPage.items, pages: { purchaseOrders: ordersPage.page, carriers: carriersPage.page } };
      }

      const [carriersPage, receiptsPage] = await Promise.all([
        warehouseApi.carrierReceiptsPage(null, signal),
        warehouseApi.goodsReceiptsPage(null, signal),
      ]);
      return { ...emptyData, carriers: carriersPage.items, goodsReceipts: receiptsPage.items, pages: { carriers: carriersPage.page, goodsReceipts: receiptsPage.page } };
    },
    [step, account?.me],
  );
  const { data, loading, error, refresh, setData } = useRemote(load, {
    enabled: !!account?.me,
  });
  const loadReferences = useCallback(
    async (signal: AbortSignal): Promise<ReceiveReferences> => {
      const me = account?.me;
      if (!me) throw new Error("ยังไม่ได้โหลดข้อมูลบัญชี");
      const activeStep: Step = me.role === "EMPLOYEE" ? "carrier" : step;
      if (activeStep === "po") {
        const [suppliers, ceos] = await Promise.all([
          warehouseApi.catalog("suppliers", signal),
          warehouseApi.ceos(signal),
        ]);
        return { step: activeStep, suppliers, ceos };
      }
      if (activeStep === "carrier")
        return {
          step: activeStep,
          branches: await warehouseApi.catalog("branches", signal),
        };
      if (activeStep === "count")
        return {
          step: activeStep,
          warehouses: await warehouseApi.catalog("warehouses", signal),
        };
      return { step: activeStep };
    },
    [step, account?.me],
  );
  const { data: references, error: referencesError } = useRemote(
    loadReferences,
    { enabled: !!account?.me },
  );
  const activeStep = data?.me.role === "EMPLOYEE" ? "carrier" : step;
  const activeReferences = references?.step === activeStep ? references : null;
  const activeData = data?.step === activeStep
    ? {
        ...data,
        suppliers: activeReferences?.suppliers ?? data.suppliers,
        ceos: activeReferences?.ceos ?? data.ceos,
        branches: activeReferences?.branches ?? data.branches,
        warehouses: activeReferences?.warehouses ?? data.warehouses,
      }
    : null;
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

  const loadMore = async (resource: CursorResource) => {
    const cursor = activeData?.pages[resource]?.nextCursor;
    if (!cursor || loadingMore.has(resource)) return;
    const controller = new AbortController();
    pageControllersRef.current.set(resource, controller);
    setLoadingMore((current) => new Set(current).add(resource));
    try {
      let result: ApiListPage<{ id: number }>;
      if (resource === "purchaseOrders") result = await warehouseApi.purchaseOrdersPage(cursor, controller.signal);
      else if (resource === "supplierReceipts") result = await warehouseApi.supplierReceiptsPage(cursor, controller.signal);
      else if (resource === "carriers") result = await warehouseApi.carrierReceiptsPage(cursor, controller.signal);
      else result = await warehouseApi.goodsReceiptsPage(cursor, controller.signal);
      setData((current) => {
        if (!current || current.step !== activeStep) return current;
        const combined = <T extends { id: number }>(items: T[], added: T[]) => {
          const known = new Set(items.map((item) => item.id));
          return [...items, ...added.filter((item) => !known.has(item.id))];
        };
        const pages = { ...current.pages, [resource]: result.page };
        if (resource === "purchaseOrders") return { ...current, pages, purchaseOrders: combined(current.purchaseOrders, result.items as typeof current.purchaseOrders) };
        if (resource === "supplierReceipts") return { ...current, pages, supplierReceipts: combined(current.supplierReceipts, result.items as typeof current.supplierReceipts) };
        if (resource === "carriers") return { ...current, pages, carriers: combined(current.carriers, result.items as typeof current.carriers) };
        return { ...current, pages, goodsReceipts: combined(current.goodsReceipts, result.items as typeof current.goodsReceipts) };
      });
    } catch (cause) {
      if (!controller.signal.aborted) setFailure(message(cause));
    } finally {
      if (pageControllersRef.current.get(resource) === controller) pageControllersRef.current.delete(resource);
      if (!controller.signal.aborted) {
        setLoadingMore((current) => { const next = new Set(current); next.delete(resource); return next; });
      }
    }
  };

  const countedCarrierIds = new Set(activeData?.carriers.filter((item) => item.has_goods_receipt).map((item) => item.id) ?? []);
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
              onClick={() => { setLoadingMore(new Set()); setStep(key); }}
            >
              {label}
            </button>
          ))}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {referencesError && <Notice tone="error">{referencesError}</Notice>}
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
                {activeData.pages.purchaseOrders?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("purchaseOrders")} onClick={() => void loadMore("purchaseOrders")}>{loadingMore.has("purchaseOrders") ? "กำลังโหลด..." : "โหลด PO เพิ่ม"}</button>}
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
                {activeData.pages.supplierReceipts?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("supplierReceipts")} onClick={() => void loadMore("supplierReceipts")}>{loadingMore.has("supplierReceipts") ? "กำลังโหลด..." : "โหลดเอกสารเพิ่ม"}</button>}
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
                {activeData.pages.carriers?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("carriers")} onClick={() => void loadMore("carriers")}>{loadingMore.has("carriers") ? "กำลังโหลด..." : "โหลดใบขนส่งเพิ่ม"}</button>}
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
                {activeData.pages.goodsReceipts?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("goodsReceipts")} onClick={() => void loadMore("goodsReceipts")}>{loadingMore.has("goodsReceipts") ? "กำลังโหลด..." : "โหลดใบตรวจรับเพิ่ม"}</button>}
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
              {activeData.pages.carriers?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("carriers")} onClick={() => void loadMore("carriers")}>{loadingMore.has("carriers") ? "กำลังโหลด..." : "โหลดใบขนส่งที่รับแล้วเพิ่ม"}</button>}
            </div>
          )}
        </div>
      )}
    </WarehousePageTemplate>
  );
}
