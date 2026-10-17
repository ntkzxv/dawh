"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Download, Loader2, Plus } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { Pagination } from "@/components/common";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import Button from "@/components/common/Button";
import SecondaryButton from "@/components/common/SecondaryButton";
import FilterDropdown from "@/components/common/FilterDropdown";
import CustomDropdown from "@/components/common/CustomDropdown";
import FilterButton from "@/components/common/FilterButton";
import DatePicker from "@/components/common/DatePicker";
import SearchInput from "@/components/common/SearchInput";
import SidePanel, { SidePanelAlert, SidePanelFieldError, sidePanelFormStyles, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
import { SkeletonBox, SkeletonDataTable } from "@/components/loading_screen/SkeletonLoading";
import { useTheme } from "@/context/ThemeContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import {
  getCachedCatalogReference,
  getWarehouseReferenceScope,
} from "@/lib/api/warehouse-reference-cache";
import { WAREHOUSE_TABLE_PAGE_SIZE } from "@/lib/warehouse/pagination-config";
import { useAppLanguage } from "@/utils/language";
import {
  warehouseApi,
  type CatalogItem,
  type StockBalance,
  type StockMovement,
} from "@/lib/api/warehouse";
import {
  Empty,
  Field,
  message,
  Notice,
  sanitizeWholeNumberInput,
  useRemote,
} from "./Ui";
import { ProductSearchSelect } from "./ProductSearchSelect";
import { canManageStock } from "@/lib/contracts/warehouse-policy";

type Tab = "balances" | "ledger";
const pageSize = WAREHOUSE_TABLE_PAGE_SIZE;
const movementKinds = [
  { value: "GOODS_RECEIPT", th: "รับสินค้าเข้า", en: "Receipt" },
  { value: "ISSUE", th: "เบิกออก", en: "Issue" },
  { value: "TRANSFER", th: "โอนย้ายคลัง", en: "Transfer" },
  { value: "ADJUSTMENT", th: "ปรับปรุงยอด", en: "Adjustment" },
  { value: "REVERSAL", th: "กลับรายการ", en: "Reversal" },
] as const;

const movementLabel = (kind: string, isThai: boolean) => {
  const match = movementKinds.find((item) => item.value === kind);
  return match ? (isThai ? match.th : match.en) : kind;
};

const formatStockDate = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const csvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function StockScreen({
  initialTab = "balances",
  showTabs = true,
}: {
  initialTab?: Tab;
  showTabs?: boolean;
}) {
  const account = useOptionalWarehouseAccount();
  const warehouseCacheScope = getWarehouseReferenceScope(account?.me);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (warehouseFilter) params.set("warehouseId", warehouseFilter);
      if (tab === "ledger") {
        if (search.trim()) params.set("q", search.trim());
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);
        if (kindFilter) params.set("kind", kindFilter);
        if (operatorFilter) params.set("operatorId", operatorFilter);
      }
      const result =
        tab === "balances"
          ? await warehouseApi.balancesPage(params, signal)
          : await warehouseApi.ledgerPage(params, signal);
      return { ...result, tab, warehouseFilter, fromDate, toDate, kindFilter, operatorFilter, requestedSearch: search, requestedPage: page };
    },
    [page, tab, warehouseFilter, fromDate, toDate, kindFilter, operatorFilter, search],
  );
  const { data, loading, error, refresh } = useRemote(load);
  const loadWarehouses = useCallback(
    (signal: AbortSignal) =>
      getCachedCatalogReference("warehouses", warehouseCacheScope, signal),
    [warehouseCacheScope],
  );
  const { data: warehouses } = useRemote(loadWarehouses, {
    enabled: Boolean(warehouseCacheScope),
  });
  const loadOperators = useCallback(
    (signal: AbortSignal) => warehouseApi.membersSummary(signal),
    [],
  );
  const { data: operators } = useRemote(loadOperators, { enabled: tab === "ledger" });
  const activeData =
    data?.tab === tab &&
    data.warehouseFilter === warehouseFilter &&
    data.fromDate === fromDate &&
    data.toDate === toDate &&
    data.kindFilter === kindFilter &&
    data.operatorFilter === operatorFilter &&
    data.requestedSearch === search &&
    data.requestedPage === page
      ? data
      : null;
  const mayManageStock = canManageStock(account?.me?.role);
  const totalPages = Math.ceil((activeData?.page.total ?? 0) / pageSize);
  const activeFilterCount = Number(Boolean(warehouseFilter)) + (tab === "ledger"
    ? Number(Boolean(search.trim())) + Number(Boolean(fromDate)) + Number(Boolean(toDate)) + Number(Boolean(kindFilter)) + Number(Boolean(operatorFilter))
    : 0);
  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setKindFilter("");
    setOperatorFilter("");
    setWarehouseFilter("");
    setPage(1);
    setFiltersOpen(false);
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element;
      if (filtersRef.current?.contains(target) || target.closest("[role='listbox'], .stock-calendar-popup")) return;
      setFiltersOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!activeData || totalPages < 1 || page <= totalPages) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setPage(totalPages);
    });
    return () => {
      active = false;
    };
  }, [activeData, totalPages, page]);

  const save = async (body: Record<string, unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.createStockDocument(body);
      setSuccess(isThai ? "บันทึกการเคลื่อนไหวแล้ว" : "Movement recorded");
      setFormOpen(false);
      await refresh();
    } catch (cause) {
      setFailure(message(cause, isThai));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reverse = async (documentId: number) => {
    const reason = window.prompt(
      `เหตุผลที่ต้องกลับรายการเอกสาร #${documentId}`,
    );
    if (!reason?.trim()) return;
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.reverseStockDocument(documentId, reason.trim());
      setSuccess("กลับรายการแล้ว");
      await refresh();
    } catch (cause) {
      setFailure(message(cause, isThai));
    }
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };
  const exportCurrentPage = () => {
    if (!activeData?.items.length) return;
    const rows = tab === "ledger"
      ? [
          isThai
            ? ["วันเวลา", "ประเภท", "รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "คลัง", "ผู้ดำเนินการ", "หมายเหตุ"]
            : ["Date", "Type", "SKU", "Product", "Quantity", "Warehouse", "Operator", "Note"],
          ...(activeData.items as StockMovement[]).map((item) => [
            formatStockDate(item.occurred_at, isThai),
            movementLabel(item.kind, isThai),
            item.sku,
            item.product_name,
            item.quantity_delta,
            item.warehouse_name,
            item.operator_name,
            item.reason,
          ]),
        ]
      : [
          isThai
            ? ["รหัสสินค้า", "ชื่อสินค้า", "สาขา", "คลัง", "จำนวน", "หน่วย"]
            : ["SKU", "Product", "Branch", "Warehouse", "Quantity", "Unit"],
          ...(activeData.items as StockBalance[]).map((item) => [
            item.sku,
            item.product_name,
            item.branch_name,
            item.warehouse_name,
            item.quantity,
            item.unit_code,
          ]),
        ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-${tab}-page-${page}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <WarehousePageTemplate
      titleEn={tab === "ledger" ? (showTabs ? "Stock Movements" : "Movement Log") : "Stock Balances"}
      titleTh={tab === "ledger" ? "ประวัติการเคลื่อนไหวสต๊อก" : "ยอดคงเหลือสต๊อก"}
      routePath="/warehouse/stock"
      iconName="layers"
      fullBleed
    >
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-10 sm:p-8">
        {error && <Notice tone="error">{error}</Notice>}
        {failure && !formOpen && <Notice tone="error">{failure}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {!showTabs && tab === "ledger" && (
              loading && !activeData ? (
                <SkeletonBox className="h-9 w-full rounded-md sm:w-[300px]" />
              ) : (
                <SearchInput
                  value={search}
                  onChange={(value) => { setSearch(value); setPage(1); }}
                  placeholder={isThai ? "ค้นหาเอกสาร สินค้า หรือคลัง" : "Search document, product, or warehouse"}
                  width="w-full sm:w-[300px]"
                  clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"}
                />
              )
            )}
            {showTabs && (
            <div
              role="tablist"
              aria-label={isThai ? "มุมมองสต๊อก" : "Stock view"}
              className={`relative grid h-[37px] min-w-[244px] grid-cols-2 rounded-[8px] border p-[3px] ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#2C2C2C]"}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-[5px] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${tab === "ledger" ? "translate-x-full" : "translate-x-0"} ${isLight ? "bg-[#222222]" : "bg-white"}`}
              />
              {(["balances", "ledger"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={tab === view}
                  onClick={() => changeTab(view)}
                  className={`relative z-10 rounded-[5px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] ${
                    tab === view
                      ? isLight ? "text-white" : "text-[#222222]"
                      : isLight ? "text-[#383838] hover:text-[#222222]" : "text-[#E4E4E7] hover:text-white"
                  }`}
                >
                  {view === "balances"
                    ? (isThai ? "ยอดคงเหลือ" : "Balances")
                    : (isThai ? "การเคลื่อนไหว" : "Movements")}
                </button>
              ))}
            </div>
            )}
            {loading && !activeData ? (
              <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
            ) : <div className="relative" ref={filtersRef}>
            <FilterButton
              controls="stock-filter-panel"
              expanded={filtersOpen}
              label={isThai ? "ตัวกรอง" : "Filters"}
              clearLabel={isThai ? "ล้างตัวกรอง" : "Clear filters"}
              activeFilterCount={activeFilterCount}
              onClear={clearFilters}
              onClick={() => setFiltersOpen((open) => !open)}
            />
            {filtersOpen && (
              <div
                id="stock-filter-panel"
                role="region"
                aria-label={isThai ? "ตัวกรองสต๊อก" : "Stock filters"}
                className={`absolute ${showTabs ? "left-0 w-[min(420px,calc(100vw-2rem))] p-4" : "right-0 w-[min(680px,calc(100vw-2rem))] p-4 sm:p-5"} top-full z-30 mt-2 space-y-4 rounded-2xl border shadow-2xl ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
              >
                {tab === "ledger" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0 space-y-1.5 text-xs font-medium">
                        <span>{isThai ? "ตั้งแต่วันที่" : "From date"}</span>
                        <DatePicker value={fromDate} onChange={(value) => { setFromDate(value); setPage(1); }} maxDate={toDate || undefined} isThai={isThai} size="sm" calendarClassName="stock-calendar-popup" />
                      </div>
                      <div className="min-w-0 space-y-1.5 text-xs font-medium">
                        <span>{isThai ? "ถึงวันที่" : "To date"}</span>
                        <DatePicker value={toDate} onChange={(value) => { setToDate(value); setPage(1); }} minDate={fromDate || undefined} isThai={isThai} size="sm" calendarClassName="stock-calendar-popup" />
                      </div>
                    </div>
                    <label className="block space-y-1.5 text-xs font-medium">
                      <span>{isThai ? "ประเภทการเคลื่อนไหว" : "Movement type"}</span>
                      <FilterDropdown value={kindFilter} onChange={(value) => { setKindFilter(value); setPage(1); }} options={[
                        { value: "", label: isThai ? "ทุกประเภท" : "All types" },
                        ...movementKinds.map((kind) => ({ value: kind.value, label: isThai ? kind.th : kind.en })),
                      ]} className="w-full" />
                    </label>
                    <label className="block space-y-1.5 text-xs font-medium">
                      <span>{isThai ? "ผู้ดำเนินการ" : "Operator"}</span>
                      <FilterDropdown value={operatorFilter} onChange={(value) => { setOperatorFilter(value); setPage(1); }} options={[
                        { value: "", label: isThai ? "ทุกคน" : "All operators" },
                        ...(operators ?? []).map((operator) => ({ value: String(operator.id), label: operator.name })),
                      ]} className="w-full" searchable />
                    </label>
                  </>
                )}
                <label className="block space-y-1.5 text-xs font-medium">
                  <span>{isThai ? "คลังสินค้า" : "Warehouse"}</span>
                  <FilterDropdown value={warehouseFilter} onChange={(value) => { setWarehouseFilter(value); setPage(1); }} options={[
                    { value: "", label: isThai ? "ทุกคลังที่มีสิทธิ์" : "All available warehouses" },
                    ...(warehouses ?? []).map((warehouse) => ({ value: String(warehouse.id), label: warehouse.name })),
                  ]} className="w-full" searchable />
                </label>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                    <Button variant="outline" onClick={clearFilters}>
                      {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>}
          </div>
          {loading && !activeData ? (
            <div className="flex flex-wrap items-center justify-end gap-2.5 sm:ml-auto">
              <SkeletonBox className="h-9 w-24 rounded-xl" />
              {mayManageStock && <SkeletonBox className="h-9 w-40 rounded-xl" />}
            </div>
          ) : <div className="flex flex-wrap items-center justify-end gap-2.5 sm:ml-auto">
            <SecondaryButton onClick={exportCurrentPage} disabled={!activeData?.items.length} icon={<Download size={14} />}>
              {isThai ? "ส่งออก" : "Export"}
            </SecondaryButton>
            {mayManageStock && (
              <Button
                variant="primary"
                onClick={() => { setFailure(null); setFormOpen(true); }}
                icon={<Plus size={14} />}
                iconPosition="left"
              >
                {isThai ? "บันทึกการเคลื่อนไหว" : "Record movement"}
              </Button>
            )}
          </div>}
        </div>

        {activeData ? (
          <>
            {tab === "balances" ? (
              <BalanceList rows={activeData.items as StockBalance[]} isThai={isThai} />
            ) : (
              <MovementList
                rows={activeData.items as StockMovement[]}
                canReverse={mayManageStock}
                onReverse={reverse}
                isThai={isThai}
              />
            )}
            {(activeData.page.total ?? 0) > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={activeData.page.total ?? 0}
                pageSize={pageSize}
                onPageChange={setPage}
                isThai={isThai}
              />
            )}
          </>
        ) : loading ? (
          <SkeletonDataTable rows={6} columns={tab === "ledger" ? 8 : 5} showToolbar={false} />
        ) : (
          <Empty text={isThai ? "ไม่สามารถโหลดข้อมูลสต๊อก" : "Unable to load stock data"} />
        )}

        {formOpen && mayManageStock && (
          <SidePanel
            item={null}
            onClose={() => { if (!busyRef.current) setFormOpen(false); }}
            eyebrow={isThai ? "จัดการสต๊อก" : "Stock management"}
            title={isThai ? "บันทึกการเคลื่อนไหว" : "Record movement"}
          >
            <StockForm warehouses={warehouses ?? []} onSave={save} onCancel={() => setFormOpen(false)} busy={busy} isThai={isThai} failure={failure} />
          </SidePanel>
        )}
      </main>
    </WarehousePageTemplate>
  );
}

function BalanceList({ rows, isThai }: { rows: StockBalance[]; isThai: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const columns: DataTableColumn<StockBalance>[] = [
    { key: "sku", header: isThai ? "รหัสสินค้า" : "SKU", className: "font-mono", render: (row) => row.sku },
    { key: "product", header: isThai ? "ชื่อสินค้า" : "Product", className: "font-medium", render: (row) => row.product_name },
    { key: "warehouse", header: isThai ? "สาขา / คลัง" : "Branch / Warehouse", render: (row) => `${row.branch_name} / ${row.warehouse_name}` },
    { key: "quantity", header: isThai ? "จำนวนคงเหลือ" : "On hand", align: "right", className: "font-mono font-semibold", render: (row) => Number(row.quantity).toLocaleString() },
    { key: "unit", header: isThai ? "หน่วย" : "Unit", render: (row) => row.unit_code },
  ];
  return (
    <section className={dataTableFrameClassName(isLight)} aria-label={isThai ? "ตารางยอดคงเหลือ" : "Stock balances"}>
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => `${row.warehouse_id}-${row.product_id}`}
        minWidth="760px"
        emptyTitle={isThai ? "ไม่พบยอดคงเหลือตามตัวกรอง" : "No matching stock balances"}
      />
    </section>
  );
}

function MovementList({
  rows,
  canReverse,
  onReverse,
  isThai,
}: {
  rows: StockMovement[];
  canReverse: boolean;
  onReverse: (id: number) => Promise<void>;
  isThai: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const columns: DataTableColumn<StockMovement>[] = [
    { key: "date", header: isThai ? "วันเวลา" : "Date & time", className: "whitespace-nowrap font-mono text-xs", render: (row) => formatStockDate(row.occurred_at, isThai) },
    {
      key: "kind",
      header: isThai ? "ประเภท" : "Type",
      render: (row) => {
        const tone = row.kind === "GOODS_RECEIPT"
          ? "bg-[#2EC4B6]/10 text-[#2EC4B6]"
          : row.kind === "ISSUE"
            ? "bg-[#E71D36]/10 text-[#E71D36]"
            : row.kind === "TRANSFER"
              ? "bg-[#6366F1]/10 text-[#6366F1]"
              : row.kind === "ADJUSTMENT"
                ? "bg-[#FF9F1C]/10 text-[#FF9F1C]"
                : isLight ? "bg-[#E4E4E7] text-[#52525B]" : "bg-[#A1A1AA]/15 text-[#A1A1AA]";
        return <span className={`inline-flex whitespace-nowrap rounded-[4px] px-2 py-1 text-[11px] font-semibold ${tone}`}>{movementLabel(row.kind, isThai)}</span>;
      },
    },
    { key: "sku", header: isThai ? "รหัสสินค้า" : "SKU", className: "font-mono", render: (row) => row.sku },
    { key: "product", header: isThai ? "ชื่อสินค้า" : "Product", className: "min-w-[180px]", render: (row) => row.product_name },
    {
      key: "quantity",
      header: isThai ? "จำนวน" : "Quantity",
      align: "right",
      className: "font-mono font-bold",
      render: (row) => {
        const amount = Number(row.quantity_delta);
        return <span className={amount >= 0 ? "text-[#2EC4B6]" : "text-[#E71D36]"}>{amount > 0 ? "+" : ""}{amount.toLocaleString()}</span>;
      },
    },
    { key: "warehouse", header: isThai ? "คลัง" : "Warehouse", render: (row) => row.warehouse_name },
    { key: "operator", header: isThai ? "ผู้ดำเนินการ" : "Operator", render: (row) => row.operator_name || "—" },
    { key: "note", header: isThai ? "หมายเหตุ" : "Note", className: `max-w-[240px] truncate ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`, render: (row) => row.reason || row.record_no },
    ...(canReverse ? [{
      key: "action",
      header: isThai ? "จัดการ" : "Action",
      align: "right" as const,
      render: (row: StockMovement) => row.kind === "REVERSAL" ? null : (
        <button
          type="button"
          onClick={() => void onReverse(row.document_id)}
          className="rounded-[6px] px-2 py-1 text-xs font-semibold text-[#E71D36] transition-colors hover:bg-[#E71D36]/10"
        >
          {isThai ? "กลับรายการ" : "Reverse"}
        </button>
      ),
    }] : []),
  ];
  return (
    <section className={dataTableFrameClassName(isLight)} aria-label={isThai ? "ตารางประวัติการเคลื่อนไหว" : "Stock movements"}>
      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        minWidth="1080px"
        emptyTitle={isThai ? "ไม่พบการเคลื่อนไหวตามตัวกรอง" : "No matching stock movements"}
      />
    </section>
  );
}

function StockForm({
  warehouses,
  onSave,
  onCancel,
  busy,
  isThai,
  failure,
}: {
  warehouses: CatalogItem[];
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  busy: boolean;
  isThai: boolean;
  failure: string | null;
}) {
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const [kind, setKind] = useState<"TRANSFER" | "ISSUE" | "ADJUSTMENT">(
    "TRANSFER",
  );
  const [warehouseId, setWarehouseId] = useState("");
  const [destination, setDestination] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [serials, setSerials] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const formContentRef = useRef<HTMLDivElement>(null);
  const clearFieldError = (field: string) => setFieldErrors((current) => current.filter((item) => item !== field));
  const activeWarehouses = warehouses.filter((item) => item.active !== false);
  useEffect(() => {
    if (failure) formContentRef.current?.scrollTo({ top: 0 });
  }, [failure]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validQuantity = kind === "ADJUSTMENT"
      ? /^-?\d{1,15}$/.test(quantity) && Number(quantity) !== 0
      : /^\d{1,15}$/.test(quantity) && Number(quantity) > 0;
    const missing = [
      !warehouseId && "warehouse",
      kind === "TRANSFER" && (!destination || destination === warehouseId) && "destination",
      !productId && "product",
      !validQuantity && "quantity",
      !reason.trim() && "reason",
    ].filter((field): field is string => Boolean(field));
    setFieldErrors(missing);
    if (missing.length) {
      formContentRef.current?.scrollTo({ top: 0 });
      return;
    }
    onSave({
      kind,
      warehouseId: Number(warehouseId),
      ...(kind === "TRANSFER"
        ? { destinationWarehouseId: Number(destination) }
        : {}),
      reason: reason.trim(),
      lines: [
        {
          productId: Number(productId),
          ...(kind === "ADJUSTMENT"
            ? { quantityDelta: quantity }
            : { quantity }),
          serialNumbers: serials
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
      ],
    });
  };
  return (
    <form className={`${styles.form} h-full`} onSubmit={submit} noValidate>
      <div ref={formContentRef} className={`${styles.content} min-h-0 flex-1 px-1 pb-4`}>
      {failure && <SidePanelAlert>{failure}</SidePanelAlert>}
      {fieldErrors.length > 0 && (
        <SidePanelAlert>{isThai ? "กรุณากรอกข้อมูลที่จำเป็นให้ครบและถูกต้อง" : "Complete the required fields correctly."}</SidePanelAlert>
      )}
      <Field label={isThai ? "ประเภท" : "Type"}>
        <CustomDropdown<typeof kind>
          value={kind}
          onChange={(value) => { setKind(value); clearFieldError("destination"); }}
          options={[
            { value: "TRANSFER", label: isThai ? "โอนระหว่างคลัง" : "Transfer" },
            { value: "ISSUE", label: isThai ? "จ่ายออก" : "Issue" },
            { value: "ADJUSTMENT", label: isThai ? "ปรับยอด" : "Adjustment" },
          ]}
          className="w-full"
          triggerClassName={styles.dropdown}
        />
      </Field>
      <Field label={isThai ? "คลังต้นทาง" : "Source warehouse"}>
        <CustomDropdown
          value={warehouseId}
          onChange={(value) => { setWarehouseId(value); setDestination(""); clearFieldError("warehouse"); clearFieldError("destination"); }}
          options={activeWarehouses.map((item) => ({ value: String(item.id), label: item.name }))}
          placeholder={isThai ? "เลือกคลัง" : "Select warehouse"}
          className="w-full"
          triggerClassName={`${styles.dropdown} ${fieldErrors.includes("warehouse") ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={fieldErrors.includes("warehouse")}
          searchable
          searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
        />
        {fieldErrors.includes("warehouse") && <SidePanelFieldError>{isThai ? "กรุณาเลือกคลังต้นทาง" : "Select a source warehouse."}</SidePanelFieldError>}
      </Field>
      {kind === "TRANSFER" && (
        <Field label={isThai ? "คลังปลายทาง" : "Destination warehouse"}>
          <CustomDropdown
            value={destination}
            onChange={(value) => { setDestination(value); clearFieldError("destination"); }}
            options={activeWarehouses.filter((item) => String(item.id) !== warehouseId).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder={isThai ? "เลือกคลัง" : "Select warehouse"}
            className="w-full"
            triggerClassName={`${styles.dropdown} ${fieldErrors.includes("destination") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={fieldErrors.includes("destination")}
            searchable
            searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
          />
          {fieldErrors.includes("destination") && <SidePanelFieldError>{isThai ? "กรุณาเลือกคลังปลายทางที่ต่างจากต้นทาง" : "Select a different destination warehouse."}</SidePanelFieldError>}
        </Field>
      )}
      <div>
        <ProductSearchSelect
          value={productId}
          onChange={(value) => { setProductId(value); clearFieldError("product"); }}
          label={isThai ? "สินค้า" : "Product"}
          isThai={isThai}
          useCommonDropdown
          invalid={fieldErrors.includes("product")}
          dropdownTriggerClassName={`${styles.dropdown} ${fieldErrors.includes("product") ? sidePanelInvalidFieldClassName : ""}`}
        />
        {fieldErrors.includes("product") && <SidePanelFieldError>{isThai ? "กรุณาเลือกสินค้า" : "Select a product."}</SidePanelFieldError>}
      </div>
      <Field label={kind === "ADJUSTMENT" ? (isThai ? "ผลต่างจำนวน (+/-)" : "Quantity difference (+/-)") : (isThai ? "จำนวน" : "Quantity")}>
        <input
          className={`${styles.input} ${fieldErrors.includes("quantity") ? sidePanelInvalidFieldClassName : ""}`}
          required
          aria-invalid={fieldErrors.includes("quantity")}
          type="text"
          inputMode={kind === "ADJUSTMENT" ? "text" : "numeric"}
          pattern={kind === "ADJUSTMENT" ? "-?[0-9]*" : "[0-9]*"}
          value={quantity}
          onChange={(event) => { setQuantity(sanitizeWholeNumberInput(event.target.value, kind === "ADJUSTMENT", quantity)); clearFieldError("quantity"); }}
        />
        {fieldErrors.includes("quantity") && <SidePanelFieldError>{isThai ? (kind === "ADJUSTMENT" ? "กรุณากรอกจำนวนเต็มที่ไม่เป็นศูนย์" : "กรุณากรอกจำนวนเต็มมากกว่าศูนย์") : (kind === "ADJUSTMENT" ? "Enter a nonzero whole number." : "Enter a positive whole number.")}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "เหตุผล" : "Reason"}>
        <textarea
          className={`${styles.input} min-h-20 py-2.5 ${fieldErrors.includes("reason") ? sidePanelInvalidFieldClassName : ""}`}
          required
          aria-invalid={fieldErrors.includes("reason")}
          value={reason}
          onChange={(event) => { setReason(event.target.value); clearFieldError("reason"); }}
        />
        {fieldErrors.includes("reason") && <SidePanelFieldError>{isThai ? "กรุณากรอกเหตุผล" : "Enter a reason."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "Serial (คั่นด้วยจุลภาค หากสินค้าใช้ Serial)" : "Serial numbers (comma separated, if applicable)"}>
        <textarea
          className={`${styles.input} min-h-20 py-2.5`}
          value={serials}
          onChange={(event) => setSerials(event.target.value)}
        />
      </Field>
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
          {isThai ? "ยกเลิก" : "Cancel"}
        </button>
        <button type="submit" className={`${styles.submit} inline-flex items-center gap-2`} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {isThai ? "บันทึก" : "Save"}
        </button>
      </div>
    </form>
  );
}
