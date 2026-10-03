"use client";

import { useCallback, useState } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi, type OutstandingLine } from "@/lib/api/warehouse";
import { button, Empty, Notice, panel, subtleButton } from "./Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { useTheme } from "@/context/ThemeContext";
import { dataTableFrameClassName } from "@/components/common/DataTable";

type ReportTab = "outstanding" | "receipts";
type ReceiptRow = Record<string, unknown>;

export default function ReportsScreen() {
  const [tab, setTab] = useState<ReportTab>("outstanding");
  return (
    <WarehousePageTemplate titleEn="Reports" titleTh="รายงานคลังสินค้า" routePath="/warehouse/reports" iconName="history">
      <div className="flex gap-2">
        <button className={tab === "outstanding" ? button : subtleButton} onClick={() => setTab("outstanding")}>PO ค้างรับ</button>
        <button className={tab === "receipts" ? button : subtleButton} onClick={() => setTab("receipts")}>ประวัติรับสินค้า</button>
      </div>
      <ReportList key={tab} tab={tab} />
    </WarehousePageTemplate>
  );
}

function ReportList({ tab }: { tab: ReportTab }) {
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
    <>

      {active.error && <Notice tone="error">{active.error}</Notice>}
      <section className={panel}>
        {tab === "outstanding" ? (
          <>
            <h2 className="mb-4 text-lg font-bold">สินค้าดีที่ยังขาดจาก PO</h2>
            {rows.length ? (
              <div className={dataTableFrameClassName(isLight)}>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-white/10"><th className="pb-2">PO / ผู้ขาย</th><th>สินค้า</th><th className="text-right">สั่ง</th><th className="text-right">นับดี</th><th className="text-right">ลงสต๊อก</th><th className="text-right">ค้างรับ</th></tr></thead>
                  <tbody>{outstanding.items.map((item) => (
                    <tr key={`${item.purchase_order_id}-${item.sku}`} className="border-b border-slate-100 dark:border-white/10">
                      <td className="py-3">{item.purchase_order_no}<small className="block text-slate-500">{item.supplier_name}</small></td>
                      <td>{item.sku} · {item.product_name}</td><td className="text-right">{item.ordered_quantity}</td><td className="text-right">{item.counted_good_quantity}</td><td className="text-right">{item.posted_good_quantity}</td><td className="text-right font-semibold text-amber-600">{item.remaining_good_quantity}</td>
                    </tr>
                  ) )}</tbody>
                </table>
                </div>
              </div>
            ) : !active.loading ? <Empty text="ไม่มี PO ค้างรับ" /> : null}
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-bold">ประวัติรับสินค้า</h2>
            {receipts.items.length ? (
              <div className={dataTableFrameClassName(isLight)}>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 dark:border-white/10"><th className="pb-2">เอกสาร</th><th>สาขา / คลัง</th><th>สินค้า</th><th className="text-right">ดี</th><th className="text-right">ชำรุด</th><th>สถานะ</th></tr></thead>
                  <tbody>{receipts.items.map((item, index) => <tr key={`${String(item.goods_receipt_id)}-${String(item.goods_receipt_line_id ?? index)}`} className="border-b border-slate-100 dark:border-white/10">
                    <td className="py-3">{String(item.goods_receipt_no ?? "")}</td><td>{String(item.branch_name ?? "")} / {String(item.warehouse_name ?? "")}</td><td>{String(item.sku ?? "")} · {String(item.product_name ?? "")}</td><td className="text-right">{String(item.good_quantity ?? "0")}</td><td className="text-right">{String(item.damaged_quantity ?? "0")}</td><td>{item.posted_at ? "ลงสต๊อกแล้ว" : "รอลงสต๊อก"}</td>
                  </tr>)}</tbody>
                </table>
                </div>
              </div>
            ) : !active.loading ? <Empty text="ยังไม่มีรายการรับสินค้า" /> : null}
          </>
        )}
      </section>
      {rows.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-zinc-400">โหลดแล้ว {rows.length.toLocaleString()} รายการ</p>
          {active.page?.hasMore && <button className={subtleButton} disabled={active.loadingMore} onClick={() => void active.loadMore()}>{active.loadingMore ? "กำลังโหลด..." : "โหลดรายการเพิ่ม"}</button>}
        </div>
      )}
    </>
  );
}
