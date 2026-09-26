"use client";

import Link from "next/link";
import { useCallback } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi } from "@/lib/api/warehouse";
import { Empty, Notice, panel, useRemote } from "./Ui";

export default function OverviewScreen() {
  const load = useCallback(async () => { const me = await warehouseApi.me(); const [orders, carriers] = await Promise.all([warehouseApi.purchaseOrders(), warehouseApi.carrierReceipts()]); if (me.role === "EMPLOYEE") return { me, orders, carriers, balances: [], issues: [] }; const [balances, issues] = await Promise.all([warehouseApi.balances(), warehouseApi.issues()]); return { me, orders, carriers, balances, issues }; }, []);
  const { data, loading, error } = useRemote(load);
  const openOrders = data?.orders.filter((item) => !item.closed_at).length ?? 0;
  const awaitingDelivery = data?.carriers.filter((item) => !item.received_at).length ?? 0;
  const openIssues = data?.issues.filter((item) => item.status !== "CLOSED").length ?? 0;
  return <WarehousePageTemplate titleEn="Warehouse" titleTh="ภาพรวมคลังสินค้า" routePath="/warehouse" iconName="package">{loading && <p>กำลังโหลดข้อมูล...</p>}{error && <Notice tone="error">{error}</Notice>}{data && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["PO ที่ยังเปิด",openOrders],["ใบขนส่งรอรับ",awaitingDelivery],["รายการสต๊อก",data.balances.length],["ปัญหาที่ยังเปิด",openIssues]].map(([label,value]) => <div key={label} className={panel}><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></div>)}</div><section className={panel}><h2 className="mb-4 text-lg font-bold">ดำเนินงาน</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Link className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-500 dark:border-white/10" href="/warehouse/receive"><strong>สั่งและรับสินค้า</strong><p className="mt-1 text-sm text-slate-500">PO → เอกสารผู้ขาย → ขนส่ง → นับ → ลงสต๊อก</p></Link>{data.me.role !== "EMPLOYEE" && <><Link className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-500 dark:border-white/10" href="/warehouse/stock"><strong>สต๊อกและการเคลื่อนไหว</strong><p className="mt-1 text-sm text-slate-500">ดูยอดจริงและบันทึกโอนหรือปรับยอด</p></Link><Link className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-500 dark:border-white/10" href="/warehouse/issues"><strong>ปัญหาและเคลม</strong><p className="mt-1 text-sm text-slate-500">บันทึกผลการติดต่อนอกระบบ</p></Link><Link className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-500 dark:border-white/10" href="/warehouse/reports"><strong>รายงาน</strong><p className="mt-1 text-sm text-slate-500">PO ค้างรับและประวัติรับสินค้า</p></Link></>}</div></section>{!data.orders.length && !data.carriers.length && <Empty text="ยังไม่มีรายการ เริ่มจากตั้งค่าข้อมูลหลักและบันทึก PO" />}</>}</WarehousePageTemplate>;
}
