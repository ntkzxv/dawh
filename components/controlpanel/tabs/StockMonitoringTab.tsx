"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown } from "@/components/common";
import type { StockBalanceRecord, StockLedgerRecord, FacilityRecord } from "../types";
import {
  Activity,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  Building,
  TrendingUp,
  Boxes,
} from "lucide-react";

interface StockMonitoringTabProps {
  balances: StockBalanceRecord[];
  ledger: StockLedgerRecord[];
  facilities: FacilityRecord[];
  isThai: boolean;
}

export default function StockMonitoringTab({
  balances,
  ledger,
  facilities,
  isThai,
}: StockMonitoringTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeSubTab, setActiveSubTab] = useState<"balances" | "ledger" | "network">("balances");
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const facilityDropdownOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกสาขา/คลัง" : "All Facilities" },
    ...facilities.map((f) => ({
      value: f.code,
      label: `${f.code} - ${f.name}`,
      badge: f.code,
    })),
  ], [facilities, isThai]);

  const filteredBalances = balances.filter((b) => {
    const matchFacility = facilityFilter === "ALL" || b.facilityCode === facilityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || b.sku.toLowerCase().includes(q) || b.productName.toLowerCase().includes(q);
    return matchFacility && matchSearch;
  });

  const totalOnHand = balances.reduce((acc, b) => acc + b.onHand, 0);
  const totalReserved = balances.reduce((acc, b) => acc + b.reserved, 0);
  const totalAvailable = balances.reduce((acc, b) => acc + b.available, 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner Notice */}
      <div className="flex items-start sm:items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isLight ? "bg-zinc-100 text-zinc-800" : "bg-[#2C2C2C] text-white"
            }`}
          >
            <Activity size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การติดตามและตรวจสอบสินค้าคงคลังภาพรวม" : "Enterprise Stock Balance & Network Monitoring"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "แสดงยอดคงเหลือจริง ยอดจอง ยอดพร้อมจ่าย บัญชีแยกประเภท และการกระจายตัวข้ามเครือข่าย"
                : "Real-time read-only oversight: inventory balances, ledger movements & facility network"}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <span className="text-xs opacity-60 font-semibold">{isThai ? "ยอดสินค้าคงคลังรวม (On-Hand)" : "Total On-Hand"}</span>
          <div className="text-2xl font-bold font-mono mt-1 text-[#0D99FF]">{totalOnHand.toLocaleString()}</div>
          <span className="text-[11px] opacity-50">{isThai ? "ทุกคลังและจุดจัดเก็บ" : "Across all facilities"}</span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <span className="text-xs opacity-60 font-semibold">{isThai ? "ยอดติดการจอง (Reserved)" : "Total Reserved"}</span>
          <div className="text-2xl font-bold font-mono mt-1 text-[#FF9F1C]">{totalReserved.toLocaleString()}</div>
          <span className="text-[11px] opacity-50">{isThai ? "เตรียมจัดส่ง/โอนย้าย" : "Awaiting outbound dispatch"}</span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <span className="text-xs opacity-60 font-semibold">{isThai ? "ยอดพร้อมใช้งาน (Available)" : "Available for Allocation"}</span>
          <div className="text-2xl font-bold font-mono mt-1 text-[#2EC4B6]">{totalAvailable.toLocaleString()}</div>
          <span className="text-[11px] opacity-50">{isThai ? "สถานะพร้อมขายและเบิก" : "Net pickable inventory"}</span>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b pb-2 border-[#444444]/30">
        <button
          type="button"
          onClick={() => setActiveSubTab("balances")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "balances"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <Boxes size={14} />
          <span>{isThai ? "ยอดคงเหลือสต็อก" : "Stock Balances"}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("ledger")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "ledger"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <History size={14} />
          <span>{isThai ? "บันทึกการเคลื่อนไหว (Ledger)" : "Stock Ledger"}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("network")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "network"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <Building size={14} />
          <span>{isThai ? "เครือข่ายสต็อกข้ามสาขา" : "Network Overview"}</span>
        </button>
      </div>

      {/* 1. Balances Sub-tab */}
      {activeSubTab === "balances" && (
        <div className="flex flex-col gap-4">
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="min-w-[170px]">
                <CustomDropdown
                  value={facilityFilter}
                  onChange={setFacilityFilter}
                  options={facilityDropdownOptions}
                  searchable={facilities.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                />
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder={isThai ? "ค้นหา SKU หรือสินค้า..." : "Filter SKU or product..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-7 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444] text-white"
                  }`}
                />
              </div>
            </div>

            <span className="opacity-60">{filteredBalances.length} {isThai ? "รายการสต็อก" : "stock lines"}</span>
          </div>

          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-xs text-left">
                <thead
                  className={`text-[11px] font-bold uppercase ${
                    isLight ? "bg-[#F4F4F5] text-zinc-600" : "bg-[#333333] text-zinc-300"
                  }`}
                >
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">{isThai ? "ชื่อสินค้า" : "Product"}</th>
                    <th className="p-3">{isThai ? "สาขา/คลัง" : "Facility"}</th>
                    <th className="p-3">{isThai ? "พิกัดจัดเก็บ" : "Location"}</th>
                    <th className="p-3 text-right">{isThai ? "ยอดรวม" : "On-Hand"}</th>
                    <th className="p-3 text-right">{isThai ? "ยอดจอง" : "Reserved"}</th>
                    <th className="p-3 text-right">{isThai ? "พร้อมจ่าย" : "Available"}</th>
                    <th className="p-3">{isThai ? "สถานะสต็อก" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444444]/30">
                  {filteredBalances.map((b) => (
                    <tr
                      key={b.id}
                      className={`transition-colors ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-[#0D99FF]">{b.sku}</td>
                      <td className="p-3 font-semibold">{b.productName}</td>
                      <td className="p-3 font-mono font-bold opacity-80">{b.facilityCode}</td>
                      <td className="p-3 font-mono text-[11px]">{b.locationCode}</td>
                      <td className="p-3 text-right font-mono font-bold">{b.onHand}</td>
                      <td className="p-3 text-right font-mono text-[#FF9F1C]">{b.reserved}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#2EC4B6]">{b.available}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === "USABLE"
                              ? "bg-[#2EC4B6]/20 text-[#2EC4B6]"
                              : b.status === "QUARANTINE"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ledger Sub-tab */}
      {activeSubTab === "ledger" && (
        <div
          className={`rounded-xl border overflow-hidden ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-xs text-left">
              <thead
                className={`text-[11px] font-bold uppercase ${
                  isLight ? "bg-[#F4F4F5] text-zinc-600" : "bg-[#333333] text-zinc-300"
                }`}
              >
                <tr>
                  <th className="p-3">{isThai ? "วันเวลา" : "Timestamp"}</th>
                  <th className="p-3">{isThai ? "สาขา" : "Facility"}</th>
                  <th className="p-3">{isThai ? "เอกสารอ้างอิง" : "Ref Doc"}</th>
                  <th className="p-3">{isThai ? "ประเภทธุรกรรม" : "Type"}</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">{isThai ? "จำนวนที่เปลี่ยน" : "Qty Change"}</th>
                  <th className="p-3 text-right">{isThai ? "ยอดคงเหลือหลังทำรายการ" : "Balance"}</th>
                  <th className="p-3">{isThai ? "ผู้บันทึก" : "Operator"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#444444]/30">
                {ledger.map((l) => (
                  <tr
                    key={l.id}
                    className={`transition-colors ${
                      isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="p-3 font-mono opacity-80">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold opacity-80">{l.facilityCode}</td>
                    <td className="p-3 font-mono text-[#0D99FF]">{l.referenceDoc}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/15">
                        {l.transactionType}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold">{l.sku}</td>
                    <td
                      className={`p-3 text-right font-mono font-bold ${
                        l.qtyChange > 0 ? "text-[#2EC4B6]" : "text-[#E71D36]"
                      }`}
                    >
                      {l.qtyChange > 0 ? `+${l.qtyChange}` : l.qtyChange}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{l.balanceAfter}</td>
                    <td className="p-3 opacity-80">{l.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Network Sub-tab */}
      {activeSubTab === "network" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((fac) => {
            const facBalances = balances.filter((b) => b.facilityCode === fac.code);
            const facTotal = facBalances.reduce((acc, b) => acc + b.onHand, 0);

            return (
              <div
                key={fac.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold opacity-60">{fac.code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-500/15">
                      {fac.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mt-2">{fac.name}</h3>
                  <div className="text-xs opacity-60 mt-0.5">{fac.province}</div>

                  <div className="mt-4 p-3 rounded-xl border bg-zinc-500/5 flex items-center justify-between">
                    <span className="text-xs opacity-80">{isThai ? "ยอดรวมสินค้าคงคลังในสาขานี้:" : "Facility Total Stock:"}</span>
                    <span className="font-mono font-bold text-base text-[#0D99FF]">{facTotal.toLocaleString()} pcs</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#444444]/30 flex items-center justify-between text-xs opacity-60">
                  <span>{facBalances.length} SKUs stocked</span>
                  <span>Manager: {fac.manager || "-"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
