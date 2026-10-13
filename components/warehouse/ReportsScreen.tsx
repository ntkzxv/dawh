"use client";

import { useCallback, useState } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi, type OutstandingLine } from "@/lib/api/warehouse";
import { button, Empty, Notice, panel, subtleButton } from "./Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { Loader2 } from "lucide-react";
import { dataTableFrameClassName, dataTableStripedRowClassName } from "@/components/common/DataTable";

type ReportTab = "outstanding" | "receipts";
type ReceiptRow = Record<string, unknown>;

export default function ReportsScreen() {
  const [tab, setTab] = useState<ReportTab>("outstanding");
  const isThai = useAppLanguage() === "TH";
  return <ReportList key={tab} tab={tab} isThai={isThai} onTabChange={setTab} />;
}

function ReportList({ tab, isThai, onTabChange }: { tab: ReportTab; isThai: boolean; onTabChange: (tab: ReportTab) => void }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const outstandingLoader = useCallback(
    (cursor: string | null, signal: AbortSignal) => warehouseApi.outstandingReportPage(cursor, signal),
    [],
  );
  const receiptsLoader = useCallback(
    (cursor: string | null, signal: AbortSignal) => warehouseApi.receiptReportPage(cursor, signal),
    [],
  );
  const outstanding = useCursorResource<OutstandingLine>(outstandingLoader, tab === "outstanding");
  const receipts = useCursorResource<ReceiptRow>(receiptsLoader, tab === "receipts");
  const active = tab === "outstanding" ? outstanding : receipts;
  const rows = tab === "outstanding" ? outstanding.items : receipts.items;

  return (
    <WarehousePageTemplate
      titleEn="Reports"
      titleTh="รายงานคลังสินค้า"
      routePath="/warehouse/reports"
      iconName="history"
      loading={active.loading && rows.length === 0}
      loadingLabel={isThai ? "กำลังโหลดรายงานคลังสินค้า" : "Loading warehouse reports"}
    >
      <div className="flex gap-2">
        <button className={tab === "outstanding" ? button : subtleButton} onClick={() => onTabChange("outstanding")}>{isThai ? "PO ค้างรับ" : "Outstanding POs"}</button>
        <button className={tab === "receipts" ? button : subtleButton} onClick={() => onTabChange("receipts")}>{isThai ? "ประวัติรับสินค้า" : "Receiving history"}</button>
      </div>

      {active.error && <Notice tone="error">{active.error}</Notice>}
      <section className={panel}>
        {tab === "outstanding" ? (
          <>
            <h2 className="mb-4 text-lg font-bold">{isThai ? "สินค้าดีที่ยังขาดจาก PO" : "Good items still outstanding on POs"}</h2>
            {rows.length ? (
              <div className={dataTableFrameClassName(isLight)}>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"><th className="pb-2">{isThai ? "PO / ผู้ขาย" : "PO / Supplier"}</th><th>{isThai ? "สินค้า" : "Product"}</th><th className="text-right">{isThai ? "สั่ง" : "Ordered"}</th><th className="text-right">{isThai ? "นับดี" : "Counted good"}</th><th className="text-right">{isThai ? "ลงสต๊อก" : "Posted"}</th><th className="text-right">{isThai ? "ค้างรับ" : "Remaining"}</th></tr></thead>
                  <tbody>{outstanding.items.map((item) => (
                    <tr key={`${item.purchase_order_id}-${item.sku}`} className={`border-b border-slate-100 dark:border-white/10 ${dataTableStripedRowClassName(isLight)}`}>
                      <td className="py-3">{item.purchase_order_no}<small className="block text-slate-500 dark:text-zinc-400">{item.supplier_name}</small></td>
                      <td>{item.sku} · {item.product_name}</td><td className="text-right">{item.ordered_quantity}</td><td className="text-right">{item.counted_good_quantity}</td><td className="text-right">{item.posted_good_quantity}</td><td className="text-right font-semibold text-amber-600">{item.remaining_good_quantity}</td>
                    </tr>
                  ) )}</tbody>
                </table>
                </div>
              </div>
            ) : !active.loading ? <Empty text={isThai ? "ไม่มี PO ค้างรับ" : "No outstanding purchase orders."} /> : null}
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-bold">{isThai ? "ประวัติรับสินค้า" : "Receiving history"}</h2>
            {receipts.items.length ? (
              <div className={dataTableFrameClassName(isLight)}>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"><th className="pb-2">{isThai ? "เอกสาร" : "Document"}</th><th>{isThai ? "สาขา / คลัง" : "Branch / Warehouse"}</th><th>{isThai ? "สินค้า" : "Product"}</th><th className="text-right">{isThai ? "ดี" : "Good"}</th><th className="text-right">{isThai ? "ชำรุด" : "Damaged"}</th><th>{isThai ? "สถานะ" : "Status"}</th></tr></thead>
                  <tbody>{receipts.items.map((item, index) => <tr key={`${String(item.goods_receipt_id)}-${String(item.goods_receipt_line_id ?? index)}`} className={`border-b border-slate-100 dark:border-white/10 ${dataTableStripedRowClassName(isLight)}`}>
                    <td className="py-3">{String(item.goods_receipt_no ?? "")}</td><td>{String(item.branch_name ?? "")} / {String(item.warehouse_name ?? "")}</td><td>{String(item.sku ?? "")} · {String(item.product_name ?? "")}</td><td className="text-right">{String(item.good_quantity ?? "0")}</td><td className="text-right">{String(item.damaged_quantity ?? "0")}</td><td>{item.posted_at ? (isThai ? "ลงสต๊อกแล้ว" : "Posted") : (isThai ? "รอลงสต๊อก" : "Awaiting posting")}</td>
                  </tr>)}</tbody>
                </table>
                </div>
              </div>
            ) : !active.loading ? <Empty text={isThai ? "ยังไม่มีรายการรับสินค้า" : "No receiving records yet."} /> : null}
          </>
        )}
      </section>
      {rows.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? `โหลดแล้ว ${rows.length.toLocaleString()} รายการ` : `${rows.length.toLocaleString()} records loaded`}</p>
          {active.page?.hasMore && <button className={subtleButton} disabled={active.loadingMore} onClick={() => void active.loadMore()}>{active.loadingMore ? <Loader2 size={16} className="animate-spin" aria-label={isThai ? "กำลังโหลด" : "Loading"} /> : (isThai ? "โหลดรายการเพิ่ม" : "Load more records")}</button>}
        </div>
      )}
    </WarehousePageTemplate>
  );
}
