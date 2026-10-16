"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
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
import DataTable, { dataTableFrameClassName } from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/Button";
import SidePanel from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { ReceivingContentSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";
import {
  Empty,
  message,
  Notice,
  subtleButton,
  useRemote,
} from "./Ui";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import {
  getCachedCatalogReference,
  getWarehouseReferenceScope,
} from "@/lib/api/warehouse-reference-cache";
import { useAppLanguage } from "@/utils/language";
import { PoDetails, PoForm } from "./receive/ReceivePo";
import { SupplierDetails, SupplierForm } from "./receive/ReceiveSupplier";
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
  pageIndices: Partial<Record<CursorResource, number>>;
  cursorHistory: Partial<Record<CursorResource, Array<string | null>>>;
};
type ReceiveReferences = {
  step: Step;
  scope: string | null;
  suppliers?: CatalogItem[];
  ceos?: Array<{ id: number; name: string }>;
  branches?: CatalogItem[];
  warehouses?: CatalogItem[];
};
const steps: Step[] = ["po", "supplier", "carrier", "count"];
const stepLabel = (step: Step, isThai: boolean) => ({
  po: isThai ? "รายการสั่งซื้อ" : "Purchase orders",
  supplier: isThai ? "เอกสารผู้ขาย" : "Supplier documents",
  carrier: isThai ? "เอกสารขนส่งและรับของ" : "Shipping and delivery",
  count: isThai ? "นับและลงสต๊อก" : "Count and post stock",
})[step];

export default function ReceiveScreen() {
  const reduceMotion = useReducedMotion();
  const account = useOptionalWarehouseAccount();
  const warehouseCacheScope = getWarehouseReferenceScope(account?.me);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const [step, setStep] = useState<Step>("po");
  const [formOpen, setFormOpen] = useState(false);
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
      if (!me) throw new Error(isThai ? "ยังไม่ได้โหลดข้อมูลบัญชี" : "Account information has not loaded yet.");
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
        pageIndices: {},
        cursorHistory: {},
      };

      if (activeStep === "po") {
        const ordersPage = await warehouseApi.purchaseOrdersPage(null, signal);
        return { ...emptyData, purchaseOrders: ordersPage.items, pages: { purchaseOrders: ordersPage.page }, pageIndices: { purchaseOrders: 1 }, cursorHistory: { purchaseOrders: [null] } };
      }

      if (activeStep === "supplier") {
        const [ordersPage, receiptsPage] = await Promise.all([
          warehouseApi.purchaseOrdersPage(null, signal),
          warehouseApi.supplierReceiptsPage(null, signal),
        ]);
        return { ...emptyData, purchaseOrders: ordersPage.items, supplierReceipts: receiptsPage.items, pages: { purchaseOrders: ordersPage.page, supplierReceipts: receiptsPage.page }, pageIndices: { purchaseOrders: 1, supplierReceipts: 1 }, cursorHistory: { purchaseOrders: [null], supplierReceipts: [null] } };
      }

      if (activeStep === "carrier") {
        const [ordersPage, carriersPage] = await Promise.all([
          warehouseApi.purchaseOrdersPage(null, signal),
          warehouseApi.carrierReceiptsPage(null, signal),
        ]);
        return { ...emptyData, purchaseOrders: ordersPage.items, carriers: carriersPage.items, pages: { purchaseOrders: ordersPage.page, carriers: carriersPage.page }, pageIndices: { purchaseOrders: 1, carriers: 1 }, cursorHistory: { purchaseOrders: [null], carriers: [null] } };
      }

      const [carriersPage, receiptsPage] = await Promise.all([
        warehouseApi.carrierReceiptsPage(null, signal),
        warehouseApi.goodsReceiptsPage(null, signal),
      ]);
      return { ...emptyData, carriers: carriersPage.items, goodsReceipts: receiptsPage.items, pages: { carriers: carriersPage.page, goodsReceipts: receiptsPage.page }, pageIndices: { carriers: 1, goodsReceipts: 1 }, cursorHistory: { carriers: [null], goodsReceipts: [null] } };
    },
    [step, account?.me, isThai],
  );
  const { data, loading, error, refresh, setData } = useRemote(load, {
    enabled: !!account?.me,
  });
  const loadReferences = useCallback(
    async (signal: AbortSignal): Promise<ReceiveReferences> => {
      const role = account?.me?.role;
      if (!role) throw new Error(isThai ? "ยังไม่ได้โหลดข้อมูลบัญชี" : "Account information has not loaded yet.");
      const activeStep: Step = role === "EMPLOYEE" ? "carrier" : step;
      if (activeStep === "po") {
        const [suppliers, ceos] = await Promise.all([
          warehouseApi.catalog("suppliers", signal),
          warehouseApi.ceos(signal),
        ]);
        return {
          step: activeStep,
          scope: warehouseCacheScope,
          suppliers,
          ceos,
        };
      }
      if (activeStep === "carrier")
        return {
          step: activeStep,
          scope: warehouseCacheScope,
          branches: await getCachedCatalogReference(
            "branches",
            warehouseCacheScope,
            signal,
          ),
        };
      if (activeStep === "count")
        return {
          step: activeStep,
          scope: warehouseCacheScope,
          warehouses: await getCachedCatalogReference(
            "warehouses",
            warehouseCacheScope,
            signal,
          ),
        };
      return { step: activeStep, scope: warehouseCacheScope };
    },
    [step, account?.me?.role, isThai, warehouseCacheScope],
  );
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [carrier, setCarrier] = useState<CarrierReceipt | null>(null);
  const [selectedSupplierReceiptId, setSelectedSupplierReceiptId] = useState<number | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<SupplierReceipt | null>(null);
  const [supplierDetailLoading, setSupplierDetailLoading] = useState(false);
  const activeStep = data?.me.role === "EMPLOYEE" ? "carrier" : step;
  const needsCarrierBranches =
    activeStep === "carrier" && !!carrier && !carrier.confirmation;
  const referencesNeededNow =
    (formOpen && (activeStep === "po" || activeStep === "count")) ||
    needsCarrierBranches;
  const {
    data: references,
    error: referencesError,
    loading: referencesLoading,
    refresh: refreshReferences,
  } = useRemote(loadReferences, {
    enabled: !!account?.me && referencesNeededNow,
  });
  const activeReferences =
    references?.step === activeStep && references.scope === warehouseCacheScope
      ? references
      : null;
  const activeData = data?.step === activeStep
    ? {
        ...data,
        suppliers: activeReferences?.suppliers ?? data.suppliers,
        ceos: activeReferences?.ceos ?? data.ceos,
        branches: activeReferences?.branches ?? data.branches,
        warehouses: activeReferences?.warehouses ?? data.warehouses,
      }
    : null;
  const formReferencesReady = activeStep === "po"
    ? !referencesLoading &&
      activeReferences?.suppliers !== undefined &&
      activeReferences?.ceos !== undefined
    : activeStep === "count"
      ? !referencesLoading && activeReferences?.warehouses !== undefined
      : true;
  useEffect(() => {
    if (!selectedPoId) return;
    const controller = new AbortController();
    void warehouseApi
      .purchaseOrder(selectedPoId, controller.signal)
      .then(setPo)
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause, isThai));
      });
    return () => controller.abort();
  }, [isThai, selectedPoId]);
  useEffect(() => {
    if (!selectedCarrierId) return;
    const controller = new AbortController();
    void warehouseApi
      .carrierReceipt(selectedCarrierId, controller.signal)
      .then(setCarrier)
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause, isThai));
      });
    return () => controller.abort();
  }, [isThai, selectedCarrierId]);
  useEffect(() => {
    if (!selectedSupplierReceiptId) return;
    const controller = new AbortController();
    setSupplierDetailLoading(true);
    void warehouseApi
      .supplierReceipt(selectedSupplierReceiptId)
      .then((item) => {
        if (!controller.signal.aborted) setSupplierDetail(item);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause, isThai));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSupplierDetailLoading(false);
      });
    return () => controller.abort();
  }, [isThai, selectedSupplierReceiptId]);
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
      setFormOpen(false);
    } catch (cause) {
      setFailure(message(cause, isThai));
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
      if (!controller.signal.aborted) setFailure(message(cause, isThai));
    } finally {
      if (pageControllersRef.current.get(resource) === controller) pageControllersRef.current.delete(resource);
      if (!controller.signal.aborted) {
        setLoadingMore((current) => { const next = new Set(current); next.delete(resource); return next; });
      }
    }
  };

  const changePage = async (resource: CursorResource, targetPage: number) => {
    const pageIndex = activeData?.pageIndices[resource] ?? 1;
    const history = activeData?.cursorHistory[resource] ?? [null];
    const isNextPage = targetPage === pageIndex + 1;
    const cursor = isNextPage
      ? activeData?.pages[resource]?.nextCursor
      : history[targetPage - 1];
    if (
      targetPage < 1 ||
      targetPage === pageIndex ||
      cursor === undefined ||
      (isNextPage && !cursor) ||
      loadingMore.has(resource)
    ) return;

    const controller = new AbortController();
    pageControllersRef.current.get(resource)?.abort();
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
        const pages = { ...current.pages, [resource]: result.page };
        const pageIndices = { ...current.pageIndices, [resource]: targetPage };
        const cursorHistory = { ...current.cursorHistory };
        const resourceHistory = [...(cursorHistory[resource] ?? [null])];
        if (targetPage > pageIndex) resourceHistory[targetPage - 1] = cursor;
        cursorHistory[resource] = resourceHistory;
        if (resource === "purchaseOrders") return { ...current, pages, pageIndices, cursorHistory, purchaseOrders: result.items as typeof current.purchaseOrders };
        if (resource === "supplierReceipts") return { ...current, pages, pageIndices, cursorHistory, supplierReceipts: result.items as typeof current.supplierReceipts };
        if (resource === "carriers") return { ...current, pages, pageIndices, cursorHistory, carriers: result.items as typeof current.carriers };
        return { ...current, pages, pageIndices, cursorHistory, goodsReceipts: result.items as typeof current.goodsReceipts };
      });
    } catch (cause) {
      if (!controller.signal.aborted) setFailure(message(cause, isThai));
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
      {loading && !data ? (
        <div aria-hidden="true" className={`flex h-[42px] w-full flex-row items-start gap-2 overflow-x-auto border-b select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#E4E4E7]/70" : "border-[#444444]"}`}>
          {steps.map((key) => (
            <div key={key} className="flex h-[42px] min-w-max flex-1 basis-0 items-center justify-center px-4">
              <SkeletonBox className="h-3.5 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : <nav aria-label={isThai ? "ขั้นตอนการรับสินค้า" : "Goods receiving steps"} className={`flex h-[42px] w-full flex-row items-start gap-2 overflow-x-auto border-b select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
        {steps
          .filter((key) => data?.me.role !== "EMPLOYEE" || key === "carrier")
          .map((key) => {
            const isCurrent = activeStep === key;
            return (
              <button
                  key={key}
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => { setLoadingMore(new Set()); setFormOpen(false); setStep(key); }}
                  className={`relative flex h-[42px] min-w-max flex-1 basis-0 items-center justify-center whitespace-nowrap px-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${isCurrent ? "font-semibold" : ""}`}
                >
                  {isCurrent && (
                    <motion.span
                      layoutId="receiving-active-tab"
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 h-0.5 ${isLight ? "bg-[#222222]" : "bg-white"}`}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={`relative z-10 truncate text-sm transition-colors ${isCurrent ? (isLight ? "text-[#222222]" : "text-[#FFFFFF]") : (isLight ? "text-[#666666]" : "text-[#E4E4E7]")} ${isLight ? "hover:text-[#222222]" : "hover:text-[#FFFFFF]"}`}>{stepLabel(key, isThai)}</span>
              </button>
            );
          })}
      </nav>}
      {error && <Notice tone="error">{error}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {!activeData && loading && (
        <div aria-label={isThai ? "กำลังโหลดข้อมูลรับสินค้า" : "Loading receiving data"}>
          <ReceivingContentSkeleton />
        </div>
      )}

      {activeData && (
        <div
          className={busy ? "pointer-events-none opacity-60" : "contents"}
          aria-busy={busy}
        >
          {activeStep === "po" && (
            <div className="space-y-5">
              <section className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{isThai ? "PO ที่บันทึกแล้ว" : "Saved purchase orders"}</h2>
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setFormOpen(true)}>{isThai ? "สร้าง PO" : "Create PO"}</Button>
                </div>
                <DataTable
                  columns={[
                    { key: "record_no", header: isThai ? "เลขที่ PO" : "PO number", className: "font-mono font-semibold" },
                    { key: "supplier_name", header: isThai ? "ผู้ขาย" : "Supplier", render: (item) => item.supplier_name || "—" },
                    { key: "status", header: isThai ? "สถานะ" : "Status", render: (item) => item.closed_at ? (isThai ? "ปิดแล้ว" : "Closed") : `${item.carrier_receipt_count ?? 0} ${isThai ? "ใบขนส่ง" : "delivery notes"}` },
                  ]}
                  data={activeData.purchaseOrders}
                  keyExtractor={(item) => item.id}
                  minWidth="560px"
                  selectedKey={selectedPoId}
                  onRowClick={(item) => { setPo(null); setSelectedPoId(item.id); }}
                  emptyTitle={isThai ? "ยังไม่มี PO" : "No purchase orders yet"}
                  className={dataTableFrameClassName(isLight)}
                />
                {activeData.pages.purchaseOrders && <Pagination currentPage={activeData.pageIndices.purchaseOrders ?? 1} totalPages={(activeData.pageIndices.purchaseOrders ?? 1) + (activeData.pages.purchaseOrders.hasMore ? 1 : 0)} pageItemCount={activeData.purchaseOrders.length} onPageChange={(targetPage) => void changePage("purchaseOrders", targetPage)} isLoading={loadingMore.has("purchaseOrders")} isThai={isThai} className="mt-3" />}
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
                        isThai ? "แก้ไข PO แล้ว" : "Purchase order updated.",
                      )
                    }
                    onClose={() =>
                      run(
                        () => warehouseApi.closePurchaseOrder(po.id),
                        isThai ? "ปิด PO แล้ว" : "Purchase order closed.",
                      )
                    }
                  />
                )}
              </section>
            </div>
          )}

          {activeStep === "supplier" && (
            <div className="space-y-5">
              <section className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{isThai ? "เอกสารผู้ขาย" : "Supplier documents"}</h2>
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setFormOpen(true)}>{isThai ? "เพิ่มเอกสารผู้ขาย" : "Add supplier document"}</Button>
                </div>
                <DataTable
                  columns={[
                    { key: "record_no", header: isThai ? "เลขที่เอกสาร" : "Document no.", className: "font-mono font-semibold" },
                    { key: "purchase_order_no", header: isThai ? "เลขที่ PO" : "PO number", className: "font-mono" },
                    { key: "supplier_name", header: isThai ? "ผู้ขาย" : "Supplier", render: (item) => item.supplier_name || "—" },
                    { key: "external_doc_no", header: isThai ? "เลขที่เอกสารผู้ขาย" : "Supplier document no.", render: (item) => item.external_doc_no || "—" },
                    { key: "document_date", header: isThai ? "วันที่เอกสาร" : "Document date", render: (item) => item.document_date || "—" },
                    { key: "total_amount", header: isThai ? "ยอดรวมบนใบ" : "Document total", align: "right", render: (item) => item.total_amount || "—" },
                  ]}
                  data={activeData.supplierReceipts}
                  keyExtractor={(item) => item.id}
                  minWidth="980px"
                  selectedKey={selectedSupplierReceiptId}
                  onRowClick={(item) => {
                    setSupplierDetail(null);
                    setSelectedSupplierReceiptId((current) => current === item.id ? null : item.id);
                  }}
                  emptyTitle={isThai ? "ยังไม่มีเอกสารผู้ขาย" : "No supplier documents yet."}
                  className={dataTableFrameClassName(isLight)}
                />
                {selectedSupplierReceiptId && (supplierDetailLoading ? (
                  <div className="mt-3 flex justify-center rounded-xl border border-slate-200 p-5 dark:border-white/10" role="status" aria-label={isThai ? "กำลังโหลดรายละเอียดเอกสารผู้ขาย" : "Loading supplier document details"}>
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                ) : supplierDetail ? <SupplierDetails detail={supplierDetail} /> : null)}
                {activeData.pages.supplierReceipts && <Pagination currentPage={activeData.pageIndices.supplierReceipts ?? 1} totalPages={(activeData.pageIndices.supplierReceipts ?? 1) + (activeData.pages.supplierReceipts.hasMore ? 1 : 0)} pageItemCount={activeData.supplierReceipts.length} onPageChange={(targetPage) => { setSelectedSupplierReceiptId(null); setSupplierDetail(null); void changePage("supplierReceipts", targetPage); }} isLoading={loadingMore.has("supplierReceipts")} isThai={isThai} className="mt-3" />}
              </section>
            </div>
          )}

          {activeStep === "carrier" && (
            <div className="space-y-5">
              <section className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{isThai ? "ใบขนส่งและสถานะรับจากขนส่ง" : "Delivery notes and arrival status"}</h2>
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setFormOpen(true)}>{isThai ? "เพิ่มใบขนส่ง" : "Add delivery note"}</Button>
                </div>
                {activeData.carriers.length ? (
                  <DataTable
                    columns={[
                      { key: "record_no", header: isThai ? "เลขที่ใบขนส่ง" : "Delivery note no.", className: "font-mono font-semibold" },
                      { key: "purchase_order_no", header: isThai ? "เลขที่ PO" : "PO number", className: "font-mono" },
                      { key: "carrier_name", header: isThai ? "ผู้ขนส่ง" : "Carrier", render: (item) => item.carrier_name || "—" },
                      { key: "status", header: isThai ? "สถานะ" : "Status", render: (item) => item.received_at ? (isThai ? "รับของแล้ว" : "Received") : (isThai ? "รอรับของ" : "Awaiting delivery") },
                    ]}
                    data={activeData.carriers}
                    keyExtractor={(item) => item.id}
                    minWidth="760px"
                    selectedKey={selectedCarrierId}
                    onRowClick={(item) => { setCarrier(null); setSelectedCarrierId(item.id); }}
                    className={dataTableFrameClassName(isLight)}
                  />
                ) : (
                  <Empty text={isThai ? "ยังไม่มีใบขนส่ง" : "No delivery notes yet."} />
                )}
                {activeData.pages.carriers && <Pagination currentPage={activeData.pageIndices.carriers ?? 1} totalPages={(activeData.pageIndices.carriers ?? 1) + (activeData.pages.carriers.hasMore ? 1 : 0)} pageItemCount={activeData.carriers.length} onPageChange={(targetPage) => void changePage("carriers", targetPage)} isLoading={loadingMore.has("carriers")} isThai={isThai} className="mt-3" />}
                {carrier && (
                  needsCarrierBranches &&
                  (referencesLoading || activeReferences?.branches === undefined) ? (
                    <div className="mt-5 space-y-3" aria-busy={referencesLoading}>
                      {referencesError ? (
                        <>
                          <Notice tone="error">{referencesError}</Notice>
                          <Button variant="secondary" onClick={() => void refreshReferences()}>
                            {isThai ? "ลองโหลดสาขาอีกครั้ง" : "Retry loading branches"}
                          </Button>
                        </>
                      ) : (
                        <div
                          className="flex justify-center rounded-xl border border-slate-200 p-6 dark:border-white/10"
                          role="status"
                          aria-label={isThai ? "กำลังโหลดสาขา" : "Loading branches"}
                        >
                          <Loader2 size={20} className="animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <CarrierDetails
                      carrier={carrier}
                      branches={activeReferences?.branches ?? []}
                      onConfirm={(body) =>
                        run(
                          () => warehouseApi.confirmDelivery(carrier.id, body),
                          isThai ? "ยืนยันรับจากขนส่งแล้ว ยังไม่เพิ่มสต๊อก" : "Delivery arrival confirmed. Stock has not been updated yet.",
                        )
                      }
                    />
                  )
                )}
              </section>
            </div>
          )}

          {activeStep === "count" && (
            <div className="space-y-5">
              <section className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{isThai ? "ใบตรวจรับ" : "Goods receipts"}</h2>
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setFormOpen(true)}>{isThai ? "เพิ่มใบตรวจรับ" : "Add goods receipt"}</Button>
                </div>
                {activeData.goodsReceipts.length ? (
                  <DataTable
                    columns={[
                      { key: "record_no", header: isThai ? "เลขที่ใบตรวจรับ" : "Goods receipt no.", className: "font-mono font-semibold" },
                      { key: "carrier_receipt_no", header: isThai ? "ใบขนส่ง" : "Delivery note", className: "font-mono" },
                      { key: "warehouse", header: isThai ? "คลังปลายทาง" : "Destination warehouse", render: (item) => item.warehouse_name || "—" },
                      { key: "status", header: isThai ? "สถานะ" : "Status", render: (item) => item.posted_at ? (isThai ? "ลงสต๊อกแล้ว" : "Posted") : (isThai ? "รอลงสต๊อก" : "Awaiting stock posting") },
                      { key: "action", header: "", align: "right", render: (item) => item.posted_at ? null : (
                        <Button variant="primary" onClick={() => run(() => warehouseApi.postGoodsReceipt(item.id), isThai ? "เพิ่มเฉพาะสินค้าดีเข้าสต๊อกแล้ว" : "Only good items were added to stock.")}>
                          {isThai ? "ลงสต๊อก" : "Post stock"}
                        </Button>
                      ) },
                    ]}
                    data={activeData.goodsReceipts}
                    keyExtractor={(item) => item.id}
                    minWidth="820px"
                    className={dataTableFrameClassName(isLight)}
                  />
                ) : (
                  <Empty text={isThai ? "ยังไม่มีใบตรวจรับ" : "No goods receipts yet."} />
                )}
                {activeData.pages.goodsReceipts && <Pagination currentPage={activeData.pageIndices.goodsReceipts ?? 1} totalPages={(activeData.pageIndices.goodsReceipts ?? 1) + (activeData.pages.goodsReceipts.hasMore ? 1 : 0)} pageItemCount={activeData.goodsReceipts.length} onPageChange={(targetPage) => void changePage("goodsReceipts", targetPage)} isLoading={loadingMore.has("goodsReceipts")} isThai={isThai} className="mt-3" />}
              </section>
              {activeData.pages.carriers?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore.has("carriers")} onClick={() => void loadMore("carriers")}>{loadingMore.has("carriers") ? <Loader2 size={16} className="animate-spin" aria-label={isThai ? "กำลังโหลด" : "Loading"} /> : (isThai ? "โหลดใบขนส่งที่รับแล้วเพิ่ม" : "Load more received delivery notes")}</button>}
            </div>
          )}
        </div>
      )}
      {formOpen && activeData && (
        <SidePanel
          item={null}
          onClose={() => setFormOpen(false)}
          eyebrow={isThai ? "การรับสินค้า" : "GOODS RECEIVING"}
          title={activeStep === "po" ? (isThai ? "สร้างใบสั่งซื้อ" : "Create purchase order") : activeStep === "supplier" ? (isThai ? "เพิ่มเอกสารผู้ขาย" : "Add supplier document") : activeStep === "carrier" ? (isThai ? "เพิ่มใบขนส่ง" : "Add delivery note") : (isThai ? "เพิ่มใบตรวจรับ" : "Add goods receipt")}
        >
          {!formReferencesReady ? (
            <div className="space-y-3 py-6" aria-busy={referencesLoading}>
              {referencesError ? (
                <>
                  <Notice tone="error">{referencesError}</Notice>
                  <Button variant="secondary" onClick={() => void refreshReferences()}>
                    {isThai ? "ลองโหลดข้อมูลอีกครั้ง" : "Retry loading references"}
                  </Button>
                </>
              ) : (
                <div
                  className="flex justify-center rounded-xl border border-slate-200 p-6 dark:border-white/10"
                  role="status"
                  aria-label={isThai ? "กำลังโหลดข้อมูลอ้างอิง" : "Loading references"}
                >
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <>
              {activeStep === "po" && <PoForm suppliers={activeData.suppliers} ceos={activeData.ceos} sidePanel onCancel={() => setFormOpen(false)} onSave={(body) => run(() => warehouseApi.createPurchaseOrder(body), isThai ? "บันทึก PO แล้ว" : "Purchase order saved.")} />}
              {activeStep === "supplier" && <SupplierForm orders={activeData.purchaseOrders} selectedPoId={selectedPoId} sidePanel onCancel={() => setFormOpen(false)} onSave={(body) => run(() => warehouseApi.createSupplierReceipt(body), isThai ? "บันทึกเอกสารผู้ขายแล้ว" : "Supplier document saved.")} />}
              {activeStep === "carrier" && <CarrierForm orders={activeData.purchaseOrders} sidePanel onCancel={() => setFormOpen(false)} onSave={(body) => run(() => warehouseApi.createCarrierReceipt(body), isThai ? "บันทึกใบขนส่งแล้ว" : "Delivery note saved.")} />}
              {activeStep === "count" && <CountForm carriers={activeData.carriers.filter((item) => !countedCarrierIds.has(item.id))} warehouses={activeData.warehouses} sidePanel onCancel={() => setFormOpen(false)} onSave={(body) => run(() => warehouseApi.createGoodsReceipt(body), isThai ? "บันทึกผลนับแล้ว รอลงสต๊อก" : "Count saved. The receipt is waiting for stock posting.")} />}
            </>
          )}
        </SidePanel>
      )}
    </WarehousePageTemplate>
  );
}
