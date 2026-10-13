"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Loader2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { Pagination } from "@/components/common";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import DatePicker from "@/components/common/DatePicker";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import FilterButton from "@/components/common/FilterButton";
import SearchInput from "@/components/common/SearchInput";
import SecondaryButton from "@/components/common/SecondaryButton";
import SidePanel, {
  SidePanelAlert,
  SidePanelFieldError,
  sidePanelFormStyles,
  sidePanelInvalidFieldClassName,
} from "@/components/common/SidePanel";
import { SkeletonBox, SkeletonDataTable } from "@/components/loading_screen/SkeletonLoading";
import { useTheme } from "@/context/ThemeContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import {
  warehouseApi,
  type CatalogItem,
  type StockTransfer,
} from "@/lib/api/warehouse";
import { canManageStock } from "@/lib/contracts/warehouse-policy";
import { useAppLanguage } from "@/utils/language";
import { Empty, Field, message, Notice, useRemote } from "./Ui";
import { ProductSearchSelect } from "./ProductSearchSelect";

const pageSize = 20;
type TransferLineDraft = {
  key: number;
  productId: string;
  quantity: string;
  serials: string;
};

const formatQuantity = (value: string | number) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });

const formatDate = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const csvCell = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function TransferScreen() {
  const account = useOptionalWarehouseAccount();
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const loadTransfers = useCallback(
    async (signal: AbortSignal) => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (search.trim()) params.set("q", search.trim());
      if (warehouseFilter) params.set("warehouseId", warehouseFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      return {
        ...await warehouseApi.stockTransfersPage(params, signal),
        requestedPage: page,
        requestedSearch: search,
        requestedWarehouse: warehouseFilter,
        requestedFrom: fromDate,
        requestedTo: toDate,
      };
    },
    [page, search, warehouseFilter, fromDate, toDate],
  );
  const { data, loading, error, refresh } = useRemote(loadTransfers);
  const loadWarehouses = useCallback(
    (signal: AbortSignal) => warehouseApi.catalog("warehouses", signal),
    [],
  );
  const { data: warehouses } = useRemote(loadWarehouses);
  const activeData =
    data?.requestedPage === page &&
    data.requestedSearch === search &&
    data.requestedWarehouse === warehouseFilter &&
    data.requestedFrom === fromDate &&
    data.requestedTo === toDate
      ? data
      : null;
  const canCreate = canManageStock(account?.me?.role);
  const activeFilterCount = Number(Boolean(warehouseFilter)) + Number(Boolean(fromDate)) + Number(Boolean(toDate));
  const totalPages = Math.ceil((activeData?.page.total ?? 0) / pageSize);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element;
      if (filtersRef.current?.contains(target) || target.closest("[role='listbox'], .transfer-calendar-popup")) return;
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
    let current = true;
    queueMicrotask(() => { if (current) setPage(totalPages); });
    return () => { current = false; };
  }, [activeData, page, totalPages]);

  const clearFilters = () => {
    setWarehouseFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
    setFiltersOpen(false);
  };

  const createTransfer = async (body: Record<string, unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.createStockDocument({ ...body, kind: "TRANSFER" });
      setSuccess(isThai ? "โอนสินค้าแล้ว และปรับยอดทั้งสองคลังเรียบร้อย" : "Transfer posted. Both warehouse balances are updated.");
      setFormOpen(false);
      setPage(1);
      await refresh();
    } catch (cause) {
      setFailure(message(cause, isThai));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reverseTransfer = async (documentId: number) => {
    const reason = window.prompt(
      isThai ? "ระบุเหตุผลที่ต้องกลับรายการโอนนี้" : "Enter a reason for reversing this transfer",
    );
    if (!reason?.trim()) return;
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.reverseStockDocument(documentId, reason.trim());
      setSelectedTransfer(null);
      setSuccess(isThai ? "กลับรายการโอนแล้ว" : "Transfer reversed.");
      await refresh();
    } catch (cause) {
      setFailure(message(cause, isThai));
    }
  };

  const exportTransfers = () => {
    if (!activeData?.items.length) return;
    const rows = [
      isThai
        ? ["เลขที่เอกสาร", "คลังต้นทาง", "คลังปลายทาง", "รายการสินค้า", "สถานะ", "วันที่", "ผู้บันทึก", "เหตุผล"]
        : ["Document", "Source", "Destination", "Product lines", "Status", "Date", "Recorded by", "Reason"],
      ...activeData.items.map((item) => [
        item.record_no,
        item.source_warehouse_name,
        item.destination_warehouse_name,
        item.line_count,
        item.status === "COMPLETED" ? (isThai ? "เสร็จสิ้น" : "Completed") : (isThai ? "กลับรายการ" : "Reversed"),
        formatDate(item.posted_at, isThai),
        item.operator_name,
        item.reason,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-transfers-page-${page}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns: DataTableColumn<StockTransfer>[] = [
    { key: "record", header: isThai ? "เลขที่โอน" : "Transfer no.", className: "whitespace-nowrap font-mono font-semibold", render: (item) => item.record_no },
    { key: "source", header: isThai ? "คลังต้นทาง" : "Source warehouse", render: (item) => item.source_warehouse_name },
    { key: "destination", header: isThai ? "คลังปลายทาง" : "Destination warehouse", render: (item) => item.destination_warehouse_name },
    { key: "lines", header: isThai ? "รายการสินค้า" : "Product lines", align: "right", render: (item) => item.line_count.toLocaleString() },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      render: (item) => item.status === "COMPLETED" ? (
        <span className="inline-flex rounded-[4px] bg-[#2EC4B6]/10 px-2 py-1 text-[11px] font-semibold text-[#2EC4B6]">{isThai ? "เสร็จสิ้น" : "Completed"}</span>
      ) : (
        <span className={`inline-flex rounded-[4px] px-2 py-1 text-[11px] font-semibold ${isLight ? "bg-[#E4E4E7] text-[#52525B]" : "bg-[#A1A1AA]/15 text-[#A1A1AA]"}`}>{isThai ? "กลับรายการ" : "Reversed"}</span>
      ),
    },
    { key: "date", header: isThai ? "วันที่บันทึก" : "Recorded", className: "whitespace-nowrap text-xs", render: (item) => formatDate(item.posted_at, isThai) },
    { key: "operator", header: isThai ? "ผู้บันทึก" : "Recorded by", render: (item) => item.operator_name || "—" },
  ];

  return (
    <WarehousePageTemplate
      titleEn="Stock Transfers"
      titleTh="โอนย้ายสต๊อก"
      routePath="/warehouse/transfer"
      iconName="transfer"
      fullBleed
      loading={loading && !activeData}
      loadingLabel={isThai ? "กำลังโหลดรายการโอนสต๊อก" : "Loading stock transfers"}
    >
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-10 sm:p-8">
        {error && <Notice tone="error">{error}</Notice>}
        {failure && !formOpen && <Notice tone="error">{failure}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5" aria-label={isThai ? "สรุปการโอนย้าย" : "Transfer summary"}>
          <TransferMetric icon={<ArrowLeftRight size={17} />} label={isThai ? "รายการโอนทั้งหมด" : "Total transfers"} value={activeData?.summary.total} detail={isThai ? "ตามคำค้นและตัวกรอง" : "Matching your search and filters"} isLight={isLight} />
          <TransferMetric icon={<ArrowUpRight size={17} />} label={isThai ? "บรรทัดสินค้าที่โอน" : "Product lines"} value={activeData?.summary.totalLines} detail={isThai ? "รวมตามรายการที่ตรงกัน" : "Across matching transfers"} isLight={isLight} />
          <TransferMetric icon={<ArrowDownLeft size={17} />} label={isThai ? "รายการโอนเดือนนี้" : "Transfers this month"} value={activeData?.summary.monthTotal} detail={isThai ? "จากคลังต้นทางไปปลายทาง" : "Source to destination"} isLight={isLight} />
          <TransferMetric icon={<RotateCcw size={17} />} label={isThai ? "รายการที่กลับรายการ" : "Reversed transfers"} value={activeData?.summary.reversedTotal} detail={isThai ? "บันทึกการกลับรายการไว้ในประวัติสต๊อก" : "Reversed through the stock ledger"} isLight={isLight} />
        </section>

        <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder={isThai ? "ค้นหาเลขที่โอน สินค้า หรือคลัง" : "Search transfer, product, or warehouse"}
              width="w-full sm:w-[300px]"
              clearLabel={isThai ? "ล้างคำค้น" : "Clear search"}
            />
            <div className="relative" ref={filtersRef}>
              <FilterButton
                controls="transfer-filter-panel"
                expanded={filtersOpen}
                label={isThai ? "ตัวกรอง" : "Filters"}
                clearLabel={isThai ? "ล้างตัวกรอง" : "Clear filters"}
                activeFilterCount={activeFilterCount}
                onClear={clearFilters}
                onClick={() => setFiltersOpen((open) => !open)}
              />
              {filtersOpen && (
                <div
                  id="transfer-filter-panel"
                  role="region"
                  aria-label={isThai ? "ตัวกรองรายการโอน" : "Transfer filters"}
                  className={`absolute left-0 top-full z-30 mt-2 w-[min(420px,calc(100vw-2rem))] space-y-4 rounded-2xl border p-4 shadow-2xl ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
                >
                  <label className="block space-y-1.5 text-xs font-medium">
                    <span>{isThai ? "คลังต้นทางหรือปลายทาง" : "Source or destination warehouse"}</span>
                    <CustomDropdown
                      value={warehouseFilter}
                      onChange={(value) => { setWarehouseFilter(value); setPage(1); }}
                      options={[
                        { value: "", label: isThai ? "ทุกคลังที่มีสิทธิ์" : "All available warehouses" },
                        ...(warehouses ?? []).filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: item.name })),
                      ]}
                      className="w-full"
                      searchable
                      searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 space-y-1.5 text-xs font-medium">
                      <span>{isThai ? "ตั้งแต่วันที่" : "From date"}</span>
                      <DatePicker value={fromDate} onChange={(value) => { setFromDate(value); setPage(1); }} maxDate={toDate || undefined} isThai={isThai} size="sm" calendarClassName="transfer-calendar-popup" />
                    </div>
                    <div className="min-w-0 space-y-1.5 text-xs font-medium">
                      <span>{isThai ? "ถึงวันที่" : "To date"}</span>
                      <DatePicker value={toDate} onChange={(value) => { setToDate(value); setPage(1); }} minDate={fromDate || undefined} isThai={isThai} size="sm" calendarClassName="transfer-calendar-popup" />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                      <Button variant="outline" onClick={clearFilters}>{isThai ? "ล้างตัวกรอง" : "Clear filters"}</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
            <SecondaryButton onClick={exportTransfers} disabled={!activeData?.items.length} icon={<Download size={14} />}>
              {isThai ? "ส่งออก" : "Export"}
            </SecondaryButton>
            {canCreate && (
              <Button variant="primary" onClick={() => { setFailure(null); setFormOpen(true); }} icon={<Plus size={14} />}>
                {isThai ? "สร้างรายการโอน" : "New transfer"}
              </Button>
            )}
          </div>
        </div>

        {activeData ? (
          <>
            <section className={dataTableFrameClassName(isLight)} aria-label={isThai ? "รายการโอนย้ายล่าสุด" : "Recent stock transfers"}>
              <DataTable
                columns={columns}
                data={activeData.items}
                keyExtractor={(item) => item.id}
                minWidth="1120px"
                onRowClick={(item) => setSelectedTransfer(item)}
                emptyTitle={isThai ? "ไม่พบรายการโอนตามตัวกรอง" : "No transfers match these filters"}
              />
            </section>
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
          <SkeletonDataTable rows={6} columns={8} showToolbar={false} />
        ) : (
          <Empty text={isThai ? "ไม่สามารถโหลดรายการโอนได้" : "Unable to load transfers"} />
        )}

        {formOpen && canCreate && (
          <SidePanel
            item={null}
            onClose={() => { if (!busyRef.current) setFormOpen(false); }}
            eyebrow={isThai ? "โอนย้ายสต๊อก" : "Stock transfer"}
            title={isThai ? "สร้างรายการโอน" : "Create transfer"}
          >
            <TransferForm
              warehouses={warehouses ?? []}
              isThai={isThai}
              busy={busy}
              failure={failure}
              onCancel={() => setFormOpen(false)}
              onSave={createTransfer}
            />
          </SidePanel>
        )}

        {selectedTransfer && (
          <SidePanel
            item={null}
            onClose={() => setSelectedTransfer(null)}
            eyebrow={isThai ? "รายละเอียดรายการโอน" : "Transfer details"}
            title={selectedTransfer.record_no}
          >
            <TransferDetails
              transfer={selectedTransfer}
              isThai={isThai}
              canReverse={canCreate && selectedTransfer.status === "COMPLETED"}
              onReverse={() => void reverseTransfer(selectedTransfer.id)}
            />
          </SidePanel>
        )}
      </main>
    </WarehousePageTemplate>
  );
}

function TransferMetric({
  icon,
  label,
  value,
  detail,
  isLight,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  detail: string;
  isLight: boolean;
}) {
  return (
    <div className={`flex min-h-[128px] flex-col justify-between gap-4 rounded-xl border p-4 sm:p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{label}</span>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${isLight ? "bg-[#F4F4F5] text-[#383838]" : "bg-white/5 text-[#E4E4E7]"}`}>{icon}</span>
      </div>
      <div>
        <div className="font-mono text-[30px] font-bold leading-9 tabular-nums text-current">{value === undefined ? <SkeletonBox className="h-8 w-16 rounded" /> : value}</div>
        <div className={`mt-1 text-xs ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{detail}</div>
      </div>
    </div>
  );
}

function TransferDetails({
  transfer,
  isThai,
  canReverse,
  onReverse,
}: {
  transfer: StockTransfer;
  isThai: boolean;
  canReverse: boolean;
  onReverse: () => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const divider = isLight ? "border-[#E4E4E7]" : "border-[#444444]";
  const mutedText = isLight ? "text-[#666666]" : "text-[#A1A1AA]";
  return (
    <div className="space-y-5 py-6 text-sm">
      <div className={`rounded-xl border p-4 ${isLight ? "border-[#E4E4E7] bg-[#F8FAFC]" : "border-[#444444] bg-[#303030]"}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className={`text-xs ${mutedText}`}>{isThai ? "คลังต้นทาง" : "Source"}</div>
            <div className="truncate font-semibold">{transfer.source_warehouse_name}</div>
          </div>
          <ArrowLeftRight className="shrink-0 text-[#6366F1]" size={18} aria-hidden="true" />
          <div className="min-w-0 flex-1 text-right">
            <div className={`text-xs ${mutedText}`}>{isThai ? "คลังปลายทาง" : "Destination"}</div>
            <div className="truncate font-semibold">{transfer.destination_warehouse_name}</div>
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-4">
        <span className={mutedText}>{isThai ? "สถานะ" : "Status"}</span>
        <span className={transfer.status === "COMPLETED" ? "font-semibold text-[#2EC4B6]" : `font-semibold ${mutedText}`}>
          {transfer.status === "COMPLETED" ? (isThai ? "เสร็จสิ้น" : "Completed") : (isThai ? "กลับรายการ" : "Reversed")}
        </span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <span className={mutedText}>{isThai ? "วันที่บันทึก" : "Recorded"}</span>
        <span className="text-right">{formatDate(transfer.posted_at, isThai)}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <span className={mutedText}>{isThai ? "ผู้บันทึก" : "Recorded by"}</span>
        <span>{transfer.operator_name || "—"}</span>
      </div>
      {transfer.reason && (
        <div className={`border-t pt-4 ${divider}`}>
          <div className={`mb-1 text-xs ${mutedText}`}>{isThai ? "เหตุผล" : "Reason"}</div>
          <p className="whitespace-pre-wrap">{transfer.reason}</p>
        </div>
      )}
      <div className={`space-y-3 border-t pt-4 ${divider}`}>
        <div className="flex items-center justify-between gap-3 font-semibold">
          <span>{isThai ? "สินค้าที่โอน" : "Transferred products"}</span>
          <span className="font-mono">{transfer.line_count.toLocaleString()} {isThai ? "บรรทัด" : "lines"}</span>
        </div>
        {transfer.lines.map((line) => (
          <div key={line.product_id} className={`flex items-start justify-between gap-4 border-t pt-3 ${divider}`}>
            <div className="min-w-0">
              <div className={`font-mono text-xs ${mutedText}`}>{line.sku}</div>
              <div className="font-medium">{line.product_name}</div>
              {line.serial_numbers?.length > 0 && <div className={`mt-1 break-all text-xs ${mutedText}`}>{line.serial_numbers.join(", ")}</div>}
            </div>
            <div className="shrink-0 font-mono font-semibold">{formatQuantity(line.quantity)} {line.unit_code}</div>
          </div>
        ))}
      </div>
      {canReverse && (
        <button
          type="button"
          onClick={onReverse}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E71D36]/30 px-3 text-xs font-semibold text-[#E71D36] transition-colors hover:bg-[#E71D36]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E71D36]"
        >
          <RotateCcw size={14} aria-hidden="true" />
          {isThai ? "กลับรายการโอน" : "Reverse transfer"}
        </button>
      )}
    </div>
  );
}

function TransferForm({
  warehouses,
  isThai,
  busy,
  failure,
  onCancel,
  onSave,
}: {
  warehouses: CatalogItem[];
  isThai: boolean;
  busy: boolean;
  failure: string | null;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const styles = sidePanelFormStyles(isLight);
  const activeWarehouses = warehouses.filter((item) => item.active !== false);
  const nextLineKey = useRef(1);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<TransferLineDraft[]>([{ key: 0, productId: "", quantity: "", serials: "" }]);
  const [errors, setErrors] = useState<string[]>([]);

  const updateLine = (key: number, patch: Partial<TransferLineDraft>) => {
    setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
    setErrors((current) => current.filter((error) =>
      !error.startsWith(`line-${key}-`) && !(patch.productId !== undefined && error === "duplicate-product"),
    ));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = [
      !source && "source",
      !destination && "destination",
      Boolean(source && destination && source === destination) && "same-location",
      !reason.trim() && "reason",
      ...lines.flatMap((line) => [
        !line.productId && `line-${line.key}-product`,
        (!/^\d{1,15}(?:\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) && `line-${line.key}-quantity`,
      ]),
      new Set(lines.map((line) => line.productId).filter(Boolean)).size !== lines.filter((line) => line.productId).length && "duplicate-product",
    ].filter((error): error is string => Boolean(error));
    setErrors(nextErrors);
    if (nextErrors.length) return;
    onSave({
      warehouseId: Number(source),
      destinationWarehouseId: Number(destination),
      reason: reason.trim(),
      lines: lines.map((line) => ({
        productId: Number(line.productId),
        quantity: line.quantity,
        serialNumbers: line.serials.split(/[,\n]/).map((serial) => serial.trim()).filter(Boolean),
      })),
    });
  };

  const hasError = (...keys: string[]) => keys.some((key) => errors.includes(key));
  return (
    <form className={`${styles.form} h-full`} onSubmit={submit} noValidate>
      <div className={`${styles.content} min-h-0 flex-1 px-1 pb-4`}>
        {failure && <SidePanelAlert>{failure}</SidePanelAlert>}
        <div className="rounded-lg border border-[#FF9F1C]/30 bg-[#FF9F1C]/10 p-3 text-xs leading-5 text-[#FF9F1C]">
          {isThai
            ? "เมื่อยืนยัน ระบบจะตัดยอดจากคลังต้นทางและเพิ่มยอดในคลังปลายทางทันที รายการจะถูกบันทึกในประวัติสต๊อก และไม่ผ่านขั้นตอนอนุมัติหรือจัดส่ง"
            : "Confirming posts the transfer immediately: stock decreases at the source and increases at the destination. Approval and shipment stages are not part of this flow."}
        </div>
        <Field label={isThai ? "คลังต้นทาง" : "Source warehouse"}>
          <CustomDropdown
            value={source}
            onChange={(value) => { setSource(value); if (value === destination) setDestination(""); setErrors((current) => current.filter((item) => item !== "source" && item !== "destination" && item !== "same-location")); }}
            options={activeWarehouses.map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder={isThai ? "เลือกคลังต้นทาง" : "Select source warehouse"}
            className="w-full"
            triggerClassName={`${styles.dropdown} ${hasError("source") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={hasError("source")}
            searchable
            searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
          />
          {hasError("source") && <SidePanelFieldError>{isThai ? "เลือกคลังต้นทาง" : "Select a source warehouse."}</SidePanelFieldError>}
        </Field>
        <Field label={isThai ? "คลังปลายทาง" : "Destination warehouse"}>
          <CustomDropdown
            value={destination}
            onChange={(value) => { setDestination(value); setErrors((current) => current.filter((item) => item !== "destination" && item !== "same-location")); }}
            options={activeWarehouses.filter((item) => String(item.id) !== source).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder={isThai ? "เลือกคลังปลายทาง" : "Select destination warehouse"}
            className="w-full"
            triggerClassName={`${styles.dropdown} ${hasError("destination", "same-location") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={hasError("destination", "same-location")}
            searchable
            searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
          />
          {hasError("destination", "same-location") && <SidePanelFieldError>{isThai ? "เลือกคลังปลายทางที่ต่างจากต้นทาง" : "Select a destination different from the source."}</SidePanelFieldError>}
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className={styles.label}>{isThai ? "รายการสินค้า" : "Products"}</h3>
            <Button type="button" variant="outline" onClick={() => setLines((current) => [...current, { key: nextLineKey.current++, productId: "", quantity: "", serials: "" }])} icon={<Plus size={14} />}>
              {isThai ? "เพิ่มสินค้า" : "Add product"}
            </Button>
          </div>
          {hasError("duplicate-product") && <SidePanelFieldError>{isThai ? "สินค้าเดียวกันให้รวมจำนวนไว้ในบรรทัดเดียว" : "Combine each product into a single line."}</SidePanelFieldError>}
          {lines.map((line, index) => (
            <div key={line.key} className={`space-y-3 rounded-xl border p-3 ${theme === "light" ? "border-[#E4E4E7] bg-[#F8FAFC]" : "border-[#444444] bg-[#303030]"}`}>
              <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{isThai ? `สินค้า ${index + 1}` : `Product ${index + 1}`}</span>
                {lines.length > 1 && (
                  <button type="button" aria-label={isThai ? "ลบสินค้า" : "Remove product"} onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className={`rounded-md p-1.5 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"} transition-colors hover:bg-[#E71D36]/10 hover:text-[#E71D36]`}>
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <ProductSearchSelect
                value={line.productId}
                onChange={(value) => updateLine(line.key, { productId: value })}
                label={isThai ? "สินค้า" : "Product"}
                isThai={isThai}
                useCommonDropdown
                invalid={hasError(`line-${line.key}-product`)}
                dropdownTriggerClassName={`${styles.dropdown} ${hasError(`line-${line.key}-product`) ? sidePanelInvalidFieldClassName : ""}`}
              />
              {hasError(`line-${line.key}-product`) && <SidePanelFieldError>{isThai ? "เลือกสินค้า" : "Select a product."}</SidePanelFieldError>}
              <Field label={isThai ? "จำนวน" : "Quantity"}>
                <input className={`${styles.input} ${hasError(`line-${line.key}-quantity`) ? sidePanelInvalidFieldClassName : ""}`} type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: event.target.value })} aria-invalid={hasError(`line-${line.key}-quantity`)} />
                {hasError(`line-${line.key}-quantity`) && <SidePanelFieldError>{isThai ? "ระบุจำนวนมากกว่าศูนย์และทศนิยมไม่เกิน 3 ตำแหน่ง" : "Enter a positive quantity with up to 3 decimal places."}</SidePanelFieldError>}
              </Field>
              <Field label={isThai ? "หมายเลขประจำสินค้า ถ้ามี" : "Serial numbers (if applicable)"}>
                <textarea className={`${styles.input} min-h-16 py-2.5`} value={line.serials} onChange={(event) => updateLine(line.key, { serials: event.target.value })} placeholder={isThai ? "คั่นแต่ละหมายเลขด้วยจุลภาคหรือขึ้นบรรทัดใหม่" : "Separate serials with commas or new lines"} />
              </Field>
            </div>
          ))}
        </div>
        <Field label={isThai ? "เหตุผลในการโอน" : "Transfer reason"}>
          <textarea className={`${styles.input} min-h-20 py-2.5 ${hasError("reason") ? sidePanelInvalidFieldClassName : ""}`} value={reason} onChange={(event) => { setReason(event.target.value); setErrors((current) => current.filter((item) => item !== "reason")); }} aria-invalid={hasError("reason")} />
          {hasError("reason") && <SidePanelFieldError>{isThai ? "ระบุเหตุผลในการโอน" : "Enter a transfer reason."}</SidePanelFieldError>}
        </Field>
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>{isThai ? "ยกเลิก" : "Cancel"}</button>
        <button type="submit" className={`${styles.submit} inline-flex items-center gap-2`} disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ArrowLeftRight size={14} aria-hidden="true" />}
          {isThai ? "ยืนยันการโอน" : "Confirm transfer"}
        </button>
      </div>
    </form>
  );
}
