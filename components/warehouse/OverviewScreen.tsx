"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CircleAlert,
  Clock3,
  Package,
} from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { warehouseApi, type StockMovement, type WarehouseDashboard } from "@/lib/api/warehouse";
import { useAppLanguage } from "@/utils/language";
import { Empty, Notice, useRemote } from "./Ui";

const cardClass = (isLight: boolean) =>
  `rounded-xl border ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`;
const mutedClass = (isLight: boolean) => isLight ? "text-[#666666]" : "text-[#A1A1AA]";

const formatQuantity = (value: string | number | null, isThai: boolean) =>
  value === null ? "—" : Number(value).toLocaleString(isThai ? "th-TH" : "en-US", { maximumFractionDigits: 3 });

const formatMovementDate = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const movementKinds = [
  { value: "GOODS_RECEIPT", th: "รับสินค้าเข้า", en: "Receipt" },
  { value: "ISSUE", th: "เบิกออก", en: "Issue" },
  { value: "TRANSFER", th: "โอนย้ายคลัง", en: "Transfer" },
  { value: "ADJUSTMENT", th: "ปรับปรุงยอด", en: "Adjustment" },
  { value: "REVERSAL", th: "กลับรายการ", en: "Reversal" },
];

function movementKindLabel(kind: string, isThai: boolean) {
  const match = movementKinds.find((item) => item.value === kind);
  return match ? (isThai ? match.th : match.en) : kind;
}

export default function OverviewScreen() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const account = useOptionalWarehouseAccount();
  const isEmployee = account?.me?.role === "EMPLOYEE";
  const load = useCallback((signal: AbortSignal) => warehouseApi.dashboard(signal), []);
  const { data, loading, error } = useRemote(load);

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "record_no",
      header: isThai ? "เลขที่เอกสาร" : "Reference",
      className: "whitespace-nowrap font-mono text-xs font-semibold",
      render: (row) => row.record_no,
    },
    {
      key: "product",
      header: isThai ? "สินค้า" : "Product",
      className: "min-w-52",
      render: (row) => (
        <div>
          <div className="font-medium">{row.product_name}</div>
          <div className={`mt-0.5 font-mono text-[11px] ${mutedClass(isLight)}`}>{row.sku}</div>
        </div>
      ),
    },
    {
      key: "kind",
      header: isThai ? "ประเภท" : "Type",
      render: (row) => <MovementTypeBadge kind={row.kind} isThai={isThai} />,
    },
    {
      key: "quantity_delta",
      header: isThai ? "จำนวน" : "Quantity",
      align: "right",
      className: "whitespace-nowrap font-mono font-semibold",
      render: (row) => {
        const amount = Number(row.quantity_delta);
        return <span className={amount > 0 ? "text-[#2EC4B6]" : "text-[#E71D36]"}>{amount > 0 ? "+" : ""}{formatQuantity(row.quantity_delta, isThai)}</span>;
      },
    },
    {
      key: "warehouse_name",
      header: isThai ? "คลัง" : "Warehouse",
      render: (row) => row.warehouse_name,
    },
    {
      key: "occurred_at",
      header: isThai ? "วันที่" : "Date",
      className: "whitespace-nowrap text-xs",
      render: (row) => formatMovementDate(row.occurred_at, isThai),
    },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      render: () => <span className="inline-flex whitespace-nowrap rounded-md border border-[#2EC4B6]/30 bg-[#2EC4B6]/10 px-2 py-1 text-[11px] font-semibold text-[#2EC4B6]">{isThai ? "ลงรายการแล้ว" : "Posted"}</span>,
    },
  ];

  return (
    <WarehousePageTemplate
      titleEn="Warehouse Dashboard"
      titleTh="ภาพรวมคลังสินค้า"
      routePath="/warehouse"
      iconName="package"
      fullBleed
      loading={loading && !data}
      loadingLabel={isThai ? "กำลังโหลดภาพรวมคลังสินค้า" : "Loading warehouse dashboard"}
    >
      <div className="flex w-full min-h-0 flex-1 flex-col gap-6 self-stretch overflow-y-auto p-6 lg:p-8">
        {error && <Notice tone="error">{error}</Notice>}

        {isEmployee ? (
          <section className={`space-y-3 rounded-xl border p-5 ${cardClass(isLight)}`}>
            <h2 className="font-bold">{isThai ? "งานรับสินค้าของคุณ" : "Your receiving work"}</h2>
            <p className={`text-sm ${mutedClass(isLight)}`}>
              {isThai ? "บัญชีนี้เข้าถึงข้อมูลสรุปสต๊อกและประวัติการเคลื่อนไหวไม่ได้" : "This account does not have access to stock summaries or movement history."}
            </p>
            <Link href="/warehouse/receive" className="inline-flex h-9 items-center rounded-lg bg-[#222222] px-3 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-[#222222] dark:hover:bg-[#F4F4F5]">
              {isThai ? "เปิดหน้ารับสินค้า" : "Open goods receiving"}
            </Link>
          </section>
        ) : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={isThai ? "ตัวชี้วัดคลังสินค้า" : "Warehouse metrics"}>
          <MetricCard
            icon={<Package size={17} />}
            label={isThai ? "สินค้าที่ใช้งาน" : "Active products"}
            value={data?.summary.activeProducts ?? null}
            detail={isThai ? "รหัสสินค้าที่ยังเปิดใช้งาน" : "Active product records"}
            loading={loading}
            isThai={isThai}
            isLight={isLight}
          />
          <MetricCard
            icon={<Boxes size={17} />}
            label={isThai ? "SKU ที่มีสินค้า" : "SKUs in stock"}
            value={data?.summary.stockedProducts ?? null}
            detail={isThai ? "รหัสสินค้าที่มียอดคงเหลือ" : "Distinct products with on-hand stock"}
            loading={loading}
            isThai={isThai}
            isLight={isLight}
          />
          <MetricCard
            icon={<ArrowDownLeft size={17} />}
            label={isThai ? "รับเข้าวันนี้" : "Received today"}
            value={data?.summary.receivedToday ?? null}
            detail={isThai ? "เอกสารรับสินค้าที่ลงรายการแล้ว" : "Receipt documents posted"}
            loading={loading}
            isThai={isThai}
            isLight={isLight}
            tone="success"
          />
          <MetricCard
            icon={<ArrowUpRight size={17} />}
            label={isThai ? "เบิกออกวันนี้" : "Issued today"}
            value={data?.summary.issuedToday ?? null}
            detail={isThai ? "เอกสารเบิกสินค้าที่ลงรายการแล้ว" : "Issue documents posted"}
            loading={loading}
            isThai={isThai}
            isLight={isLight}
            tone="danger"
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={isThai ? "รายการที่ต้องติดตาม" : "Items to monitor"}>
          <AlertMetric
            icon={<AlertTriangle size={16} />}
            label={isThai ? "สินค้าใกล้หมด" : "Low stock"}
            value={data?.summary.lowStockProducts ?? null}
            secondaryLabel={isThai ? "หมดสต๊อก" : "Out of stock"}
            secondaryValue={data?.summary.outOfStockProducts ?? null}
            color="warning"
            loading={loading}
            isThai={isThai}
            isLight={isLight}
          />
          <AlertMetric
            icon={<CircleAlert size={16} />}
            label={isThai ? "ปัญหาที่ยังเปิด" : "Open issues"}
            value={data?.summary.openIssues ?? null}
            color="danger"
            loading={loading}
            isThai={isThai}
            isLight={isLight}
          />
          <AlertMetric
            icon={<Clock3 size={16} />}
            label={isThai ? "ติดตามเคลมเกินกำหนด" : "Overdue claim follow-ups"}
            value={data?.summary.overdueClaims ?? null}
            color="info"
            loading={loading}
            isThai={isThai}
            isLight={isLight}
          />
          <div className={`flex min-h-[108px] flex-col justify-between rounded-xl border p-4 ${cardClass(isLight)}`}>
            <span className={`text-sm ${mutedClass(isLight)}`}>{isThai ? "งานคลังสินค้า" : "Warehouse tasks"}</span>
            <Link href="/warehouse/receive" className={`text-sm font-semibold underline decoration-[#6366F1]/50 underline-offset-4 transition-colors hover:text-[#6366F1] ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}>
              {isThai ? "เปิดหน้ารับสินค้า" : "Open goods receiving"}
            </Link>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
          <MovementTrend data={data?.monthlyMovements ?? []} loading={loading} isThai={isThai} isLight={isLight} />
          <CategoryDonut data={data?.categoryMix ?? []} loading={loading} isThai={isThai} isLight={isLight} />
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-2">
          <BranchStockList data={data?.branchStock ?? []} loading={loading} isThai={isThai} isLight={isLight} />
          <LowStockList data={data?.lowStockItems ?? []} loading={loading} isThai={isThai} isLight={isLight} />
        </section>

        <section className={`space-y-4 rounded-xl border p-4 sm:p-5 ${cardClass(isLight)}`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">{isThai ? "ความเคลื่อนไหวล่าสุด" : "Recent movements"}</h2>
              <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{isThai ? "รายการที่ลงบัญชีสต๊อกล่าสุด" : "Latest posted stock ledger entries"}</p>
            </div>
            <Link href="/warehouse/movements" className="text-sm font-semibold text-[#6366F1] hover:underline">
              {isThai ? "ดูประวัติทั้งหมด" : "View movement log"}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((row) => <SkeletonBox key={row} className="h-11 rounded-lg" />)}</div>
          ) : data?.recentMovements.length ? (
            <div className={dataTableFrameClassName(isLight)}>
              <DataTable columns={columns} data={data.recentMovements} keyExtractor={(row) => row.id} minWidth="1080px" />
            </div>
          ) : (
            <Empty text={isThai ? "ยังไม่มีความเคลื่อนไหวในสาขาที่ดูได้" : "No movements in your branch scope yet."} />
          )}
        </section>
        </>}
      </div>
    </WarehousePageTemplate>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  loading,
  isThai,
  isLight,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  detail: string;
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
  tone?: "success" | "danger";
}) {
  const valueClass = tone === "success" ? "text-[#2EC4B6]" : tone === "danger" ? "text-[#E71D36]" : isLight ? "text-[#222222]" : "text-[#F8FAFC]";
  return (
    <article className={`flex min-h-[142px] flex-col justify-between gap-4 rounded-xl border p-5 ${cardClass(isLight)}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={`text-sm ${mutedClass(isLight)}`}>{label}</h2>
        <span className={`flex size-8 items-center justify-center rounded-lg ${isLight ? "bg-[#F4F4F5]" : "bg-white/5"} ${valueClass}`}>{icon}</span>
      </div>
      <div>
        <p className={`font-mono text-[30px] font-bold leading-9 tabular-nums ${valueClass}`}>
          {loading ? <SkeletonBox className="h-8 w-20 rounded" /> : formatQuantity(value, isThai)}
        </p>
        <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{detail}</p>
      </div>
    </article>
  );
}

function AlertMetric({
  icon,
  label,
  value,
  secondaryLabel,
  secondaryValue,
  color,
  loading,
  isThai,
  isLight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  secondaryLabel?: string;
  secondaryValue?: number | null;
  color: "warning" | "danger" | "info";
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
}) {
  const colorClass = color === "warning" ? "text-[#FF9F1C]" : color === "danger" ? "text-[#E74C3C] dark:text-[#E71D36]" : "text-[#6366F1]";
  return (
    <article className={`flex min-h-[108px] items-start gap-3 rounded-xl border p-4 ${cardClass(isLight)}`}>
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isLight ? "bg-[#F4F4F5]" : "bg-white/5"} ${colorClass}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${mutedClass(isLight)}`}>{label}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`font-mono text-xl font-bold tabular-nums ${colorClass}`}>
            {loading ? <SkeletonBox className="inline-block h-6 w-12 rounded align-middle" /> : formatQuantity(value, isThai)}
          </span>
          {secondaryLabel && (
            <span className={`text-xs ${mutedClass(isLight)}`}>
              {secondaryLabel} <strong className="font-mono">{loading ? "…" : formatQuantity(secondaryValue ?? null, isThai)}</strong>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function MovementTrend({
  data,
  loading,
  isThai,
  isLight,
}: {
  data: WarehouseDashboard["monthlyMovements"];
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
}) {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const inbound = data.map((item) => Number(item.inbound));
  const outbound = data.map((item) => Number(item.outbound));
  const max = Math.max(1, ...inbound, ...outbound);
  const chartWidth = 840;
  const top = 16;
  const plotHeight = 174;
  const left = 52;
  const right = 12;
  const bottom = top + plotHeight;
  const step = data.length > 1 ? (chartWidth - left - right) / data.length : 0;
  const barWidth = Math.min(18, step * 0.25);
  const grid = isLight ? "#E4E4E7" : "#4A4A4A";
  const text = isLight ? "#71717A" : "#A1A1AA";
  const months = data.map((item) => {
    const [year, month] = item.month.split("-").map(Number);
    return new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", { month: "short" }).format(new Date(Date.UTC(year, month - 1, 1)));
  });

  return (
    <article className={`min-w-0 space-y-4 rounded-xl border p-5 sm:p-6 ${cardClass(isLight)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{isThai ? "แนวโน้มรับเข้าและเบิกออก" : "Inbound and outbound trend"}</h2>
          <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{isThai ? "จำนวนเอกสารย้อนหลัง 12 เดือน" : "Posted documents over the last 12 months"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex gap-4 text-xs">
            <Legend color="#2EC4B6" label={isThai ? "รับเข้า" : "Inbound"} isLight={isLight} />
            <Legend color="#E71D36" label={isThai ? "เบิกออก" : "Issued"} isLight={isLight} />
          </div>
          {activeMonth !== null && (
            <span className={`rounded-md px-2 py-1 text-[11px] font-medium tabular-nums ${isLight ? "bg-[#F4F4F5] text-[#222222]" : "bg-[#2C2C2C] text-[#F8FAFC]"}`}>
              {months[activeMonth]} · {isThai ? "รับเข้า" : "Inbound"} {formatQuantity(inbound[activeMonth], isThai)} · {isThai ? "เบิกออก" : "Issued"} {formatQuantity(outbound[activeMonth], isThai)}
            </span>
          )}
        </div>
      </div>
      {loading ? <SkeletonBox className="h-[250px] rounded-lg" /> : data.length ? (
        <div className="min-w-0">
          <svg className="h-[220px] w-full overflow-visible" viewBox={`0 0 ${chartWidth} 222`} role="group" aria-label={isThai ? "กราฟจำนวนเอกสารรับเข้าและเบิกออกรายเดือน" : "Monthly inbound and outbound document count chart"}>
            {[0, 1, 2, 3, 4].map((tick) => {
              const y = top + (plotHeight / 4) * tick;
              const value = Math.round(max * (1 - tick / 4));
              return <g key={tick}>
                <line x1={left} x2={chartWidth - right} y1={y} y2={y} stroke={grid} strokeDasharray="4 5" />
                <text x={left - 8} y={y + 4} textAnchor="end" fill={text} fontSize="10">{value.toLocaleString(isThai ? "th-TH" : "en-US")}</text>
              </g>;
            })}
            {data.map((item, index) => {
              const x = left + step * index + step / 2;
              const incoming = Number(item.inbound);
              const outgoing = Number(item.outbound);
              const incomingHeight = (incoming / max) * plotHeight;
              const outgoingHeight = (outgoing / max) * plotHeight;
              const active = activeMonth === index;
              const dimmed = activeMonth !== null && !active;
              return <g key={item.month}>
                <rect x={x - barWidth - 1} y={bottom - incomingHeight} width={barWidth} height={Math.max(1, incomingHeight)} rx="3" fill="#2EC4B6" fillOpacity={dimmed ? "0.28" : "0.9"} stroke={active ? "#F8FAFC" : "none"} strokeWidth={active ? "1.5" : "0"} className="cursor-pointer transition-all duration-150 hover:brightness-125 hover:drop-shadow-[0_0_5px_rgba(46,196,182,0.75)] focus:outline-none" tabIndex={0} role="button" aria-label={`${months[index]} · ${isThai ? "รับเข้า" : "Inbound"}: ${formatQuantity(incoming, isThai)} · ${isThai ? "เบิกออก" : "Issued"}: ${formatQuantity(outgoing, isThai)}`} onMouseEnter={() => setActiveMonth(index)} onMouseLeave={() => setActiveMonth(null)} onFocus={() => setActiveMonth(index)} onBlur={() => setActiveMonth(null)}>
                  <title>{`${months[index]} · ${isThai ? "รับเข้า" : "Inbound"}: ${formatQuantity(incoming, isThai)} ${isThai ? "เอกสาร" : "documents"}`}</title>
                </rect>
                <rect x={x + 1} y={bottom - outgoingHeight} width={barWidth} height={Math.max(1, outgoingHeight)} rx="3" fill="#E71D36" fillOpacity={dimmed ? "0.28" : "0.82"} stroke={active ? "#F8FAFC" : "none"} strokeWidth={active ? "1.5" : "0"} className="cursor-pointer transition-all duration-150 hover:brightness-125 hover:drop-shadow-[0_0_5px_rgba(231,29,54,0.75)] focus:outline-none" tabIndex={0} role="button" aria-label={`${months[index]} · ${isThai ? "เบิกออก" : "Issued"}: ${formatQuantity(outgoing, isThai)}`} onMouseEnter={() => setActiveMonth(index)} onMouseLeave={() => setActiveMonth(null)} onFocus={() => setActiveMonth(index)} onBlur={() => setActiveMonth(null)}>
                  <title>{`${months[index]} · ${isThai ? "เบิกออก" : "Issued"}: ${formatQuantity(outgoing, isThai)} ${isThai ? "เอกสาร" : "documents"}`}</title>
                </rect>
                <text x={x} y={bottom + 19} textAnchor="middle" fill={active ? (isLight ? "#222222" : "#FFFFFF") : text} fontSize={active ? "11" : "10"} fontWeight={active ? "700" : "400"}>{months[index]}</text>
              </g>;
            })}
          </svg>
        </div>
      ) : <Empty text={isThai ? "ยังไม่มีข้อมูลการเคลื่อนไหว" : "No movement data yet."} />}
    </article>
  );
}

function CategoryDonut({
  data,
  loading,
  isThai,
  isLight,
}: {
  data: WarehouseDashboard["categoryMix"];
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const palette = ["#2EC4B6", "#6366F1", "#FF9F1C", "#E71D36", "#A1A1AA", "#0D99FF"];
  const ranked = data.slice(0, 5);
  const rest = data.slice(5).reduce((sum, item) => sum + item.products, 0);
  const values = [...ranked, ...(rest ? [{ category: isThai ? "หมวดอื่น ๆ" : "Other categories", products: rest }] : [])];
  const total = data.reduce((sum, item) => sum + item.products, 0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <article className={`space-y-4 rounded-xl border p-5 sm:p-6 ${cardClass(isLight)}`}>
      <div>
        <h2 className="font-bold">{isThai ? "สัดส่วนสินค้าตามหมวดหมู่" : "Product category mix"}</h2>
        <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{isThai ? "นับตามรหัสสินค้าที่เปิดใช้งาน" : "Active product records by category"}</p>
      </div>
      {loading ? <div className="grid min-h-[190px] grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,1.1fr)]"><div className="flex justify-center"><SkeletonBox className="size-44 rounded-full" /></div><div className="space-y-3">{[0, 1, 2, 3].map((item) => <SkeletonBox key={item} className="h-5 rounded" />)}</div></div> : total ? (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative mx-auto size-48" role="group" aria-label={isThai ? `สินค้า ${formatQuantity(total, isThai)} รายการใน ${data.length} หมวดหมู่` : `${formatQuantity(total, isThai)} products across ${data.length} categories`}>
            <svg viewBox="0 0 200 200" className="size-full -rotate-90 overflow-visible">
              <circle cx="100" cy="100" r={radius} fill="none" stroke={isLight ? "#E4E4E7" : "#4A4A4A"} strokeWidth="26" />
              {values.map((item, index) => {
                const segment = (item.products / total) * circumference;
                const segmentOffset = offset;
                offset += segment;
                const active = activeCategory === index;
                const dimmed = activeCategory !== null && !active;
                return <circle
                  key={item.category}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={palette[index % palette.length]}
                  strokeWidth={active ? 36 : 28}
                  strokeDasharray={`${Math.max(0, segment - 2)} ${circumference - segment + 2}`}
                  strokeDashoffset={-segmentOffset}
                  opacity={dimmed ? 0.32 : 1}
                  className="cursor-pointer transition-all duration-200 hover:brightness-125 focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.category}: ${item.products} ${isThai ? "สินค้า" : "products"} (${Math.round((item.products / total) * 100)}%)`}
                  onMouseEnter={() => setActiveCategory(index)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onFocus={() => setActiveCategory(index)}
                  onBlur={() => setActiveCategory(null)}
                />;
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <span className="font-mono text-2xl font-bold tabular-nums">{formatQuantity(activeCategory === null ? total : values[activeCategory]?.products ?? total, isThai)}</span>
              <span className={`mt-0.5 text-[11px] ${mutedClass(isLight)}`}>{activeCategory === null ? (isThai ? "สินค้า" : "products") : `${Math.round(((values[activeCategory]?.products ?? 0) / total) * 100)}%`}</span>
            </div>
          </div>
          <ul className="min-w-0 space-y-1.5">
            {values.map((item, index) => (
              <li key={item.category}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition-all duration-150 ${activeCategory === index ? (isLight ? "bg-[#F4F4F5] shadow-sm" : "bg-[#2C2C2C] shadow-sm") : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"} ${activeCategory !== null && activeCategory !== index ? "opacity-45" : "opacity-100"}`}
                  onMouseEnter={() => setActiveCategory(index)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onFocus={() => setActiveCategory(index)}
                  onBlur={() => setActiveCategory(null)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`size-2.5 shrink-0 rounded-sm transition-transform ${activeCategory === index ? "scale-125" : ""}`} style={{ backgroundColor: palette[index % palette.length] }} />
                    <span className="truncate">{item.category}</span>
                  </span>
                  <span className={`shrink-0 font-mono tabular-nums ${activeCategory === index ? (isLight ? "text-[#222222]" : "text-[#F8FAFC]") : mutedClass(isLight)}`}>{item.products.toLocaleString(isThai ? "th-TH" : "en-US")} · {Math.round((item.products / total) * 100)}%</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : <Empty text={isThai ? "ยังไม่มีข้อมูลหมวดหมู่สินค้า" : "No product categories yet."} />}
    </article>
  );
}

function BranchStockList({
  data,
  loading,
  isThai,
  isLight,
}: {
  data: WarehouseDashboard["branchStock"];
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
}) {
  const max = Math.max(0, ...data.map((item) => item.stockedProducts));
  return (
    <article className={`space-y-4 rounded-xl border p-5 sm:p-6 ${cardClass(isLight)}`}>
      <div>
        <h2 className="font-bold">{isThai ? "สต็อกแยกตามสาขา" : "Stock by branch"}</h2>
        <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{isThai ? "จำนวน SKU ที่มีสต๊อกแยกตามสาขา" : "Distinct stocked SKUs by branch"}</p>
      </div>
      {loading ? <div className="space-y-4">{[0, 1, 2, 3].map((item) => <SkeletonBox key={item} className="h-8 rounded" />)}</div> : data.length ? (
        <div className="space-y-4">
          {data.slice(0, 6).map((item) => {
            const quantity = item.stockedProducts;
            const percent = max > 0 ? Math.max(2, (quantity / max) * 100) : 0;
            return <div key={item.branchId}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.branch}</span>
                <span className={`shrink-0 font-mono text-xs tabular-nums ${mutedClass(isLight)}`}>{formatQuantity(item.stockedProducts, isThai)} {isThai ? "SKU" : "SKUs"}</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"}`}>
                <div className="h-full rounded-full bg-[#6366F1] transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            </div>;
          })}
        </div>
      ) : <Empty text={isThai ? "ไม่มีข้อมูลสาขาในขอบเขตนี้" : "No branches in this access scope."} />}
    </article>
  );
}

function LowStockList({
  data,
  loading,
  isThai,
  isLight,
}: {
  data: WarehouseDashboard["lowStockItems"];
  loading: boolean;
  isThai: boolean;
  isLight: boolean;
}) {
  return (
    <article className={`space-y-4 rounded-xl border p-5 sm:p-6 ${cardClass(isLight)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{isThai ? "สินค้าที่ต้องเติม" : "Restock attention"}</h2>
          <p className={`mt-1 text-xs ${mutedClass(isLight)}`}>{isThai ? "รายการที่ต่ำกว่าจุดสั่งซื้อหรือหมดสต๊อก" : "Products at or below their reorder point"}</p>
        </div>
        <Link href="/warehouse/inventory?kind=products&status=low_stock" className="shrink-0 text-xs font-semibold text-[#6366F1] hover:underline">
          {isThai ? "ดูสินค้า" : "View products"}
        </Link>
      </div>
      {loading ? <div className="space-y-3">{[0, 1, 2, 3].map((item) => <SkeletonBox key={item} className="h-12 rounded-lg" />)}</div> : data.length ? (
        <ul className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}>
          {data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className={`mt-0.5 font-mono text-[11px] ${mutedClass(isLight)}`}>{item.sku}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`font-mono text-sm font-semibold tabular-nums ${item.status === "out_of_stock" ? "text-[#E71D36]" : "text-[#FF9F1C]"}`}>{formatQuantity(item.onHand, isThai)}</span>
                <p className={`mt-0.5 text-[11px] ${mutedClass(isLight)}`}>{item.status === "out_of_stock" ? (isThai ? "หมดสต๊อก" : "Out of stock") : `${isThai ? "จุดสั่งซื้อ" : "Reorder at"} ${formatQuantity(item.reorderPoint, isThai)}`}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty text={isThai ? "ไม่มีสินค้าที่ต่ำกว่าจุดสั่งซื้อ" : "No products below their reorder point."} />}
    </article>
  );
}

function MovementTypeBadge({ kind, isThai }: { kind: string; isThai: boolean }) {
  const style = kind === "GOODS_RECEIPT"
    ? "bg-[#2EC4B6]/10 text-[#2EC4B6]"
    : kind === "ISSUE"
      ? "bg-[#E71D36]/10 text-[#E71D36]"
      : kind === "TRANSFER"
        ? "bg-[#6366F1]/10 text-[#6366F1]"
        : kind === "ADJUSTMENT"
          ? "bg-[#FF9F1C]/10 text-[#FF9F1C]"
          : "bg-[#A1A1AA]/15 text-[#A1A1AA]";
  return <span className={`inline-flex whitespace-nowrap rounded-[4px] px-2 py-1 text-[11px] font-semibold ${style}`}>{movementKindLabel(kind, isThai)}</span>;
}

function Legend({ color, label, isLight }: { color: string; label: string; isLight: boolean }) {
  return <span className={`flex items-center gap-1.5 ${mutedClass(isLight)}`}><span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />{label}</span>;
}
