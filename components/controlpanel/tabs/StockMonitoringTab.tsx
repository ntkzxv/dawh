"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown, DataTable } from "@/components/common";
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
          <div className="text-2xl font-bold font-mono mt-1 text-[#6366F1]">{totalOnHand.toLocaleString()}</div>
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

          <DataTable<StockBalanceRecord>
            data={filteredBalances}
            keyExtractor={(b) => b.id}
            minWidth="800px"
            emptyTitle={isThai ? "ไม่พบยอดคงเหลือสินค้า" : "No stock balances found"}
            columns={[
              {
                key: "sku",
                header: "SKU",
                render: (b) => (
                  <span className="font-mono font-bold text-[#6366F1]">{b.sku}</span>
                ),
              },
              {
                key: "productName",
                header: isThai ? "ชื่อสินค้า" : "Product",
                render: (b) => (
                  <span className={`font-semibold ${isLight ? "text-zinc-900" : "text-white"}`}>
                    {b.productName}
                  </span>
                ),
              },
              {
                key: "facilityCode",
                header: isThai ? "สาขา/คลัง" : "Facility",
                render: (b) => <span className="font-mono font-bold opacity-80">{b.facilityCode}</span>,
              },
              {
                key: "locationCode",
                header: isThai ? "พิกัดจัดเก็บ" : "Location",
                render: (b) => <span className="font-mono text-[11px]">{b.locationCode}</span>,
              },
              {
                key: "onHand",
                header: isThai ? "ยอดรวม" : "On-Hand",
                align: "right",
                render: (b) => (
                  <span className={`font-mono font-bold ${isLight ? "text-zinc-900" : "text-white"}`}>
                    {b.onHand}
                  </span>
                ),
              },
              {
                key: "reserved",
                header: isThai ? "ยอดจอง" : "Reserved",
                align: "right",
                render: (b) => <span className="font-mono text-[#FF9F1C]">{b.reserved}</span>,
              },
              {
                key: "available",
                header: isThai ? "พร้อมจ่าย" : "Available",
                align: "right",
                render: (b) => (
                  <span className="font-mono font-bold text-[#2EC4B6]">{b.available}</span>
                ),
              },
              {
                key: "status",
                header: isThai ? "สถานะสต็อก" : "Status",
                render: (b) => (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === "USABLE"
                        ? "bg-[#2EC4B6]/20 text-[#2EC4B6]"
                        : "bg-[#FF9F1C]/20 text-[#FF9F1C]"
                    }`}
                  >
                    {b.status}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 2. Ledger Sub-tab */}
      {activeSubTab === "ledger" && (
        <div className="flex flex-col gap-4">
          <DataTable<StockLedgerRecord>
            data={ledger}
            keyExtractor={(l) => l.id}
            minWidth="800px"
            emptyTitle={isThai ? "ไม่พบบัญชีคุมสต็อก" : "No ledger records found"}
            columns={[
              {
                key: "timestamp",
                header: isThai ? "วัน-เวลา" : "Timestamp",
                render: (l) => (
                  <span className="font-mono opacity-80">
                    {new Date(l.timestamp).toLocaleString()}
                  </span>
                ),
              },
              {
                key: "facilityCode",
                header: isThai ? "สาขา" : "Facility",
                render: (l) => (
                  <span className="font-mono font-bold opacity-80">{l.facilityCode}</span>
                ),
              },
              {
                key: "referenceDoc",
                header: isThai ? "เอกสารอ้างอิง" : "Ref Doc",
                render: (l) => (
                  <span className="font-mono text-[#6366F1]">{l.referenceDoc}</span>
                ),
              },
              {
                key: "transactionType",
                header: isThai ? "ประเภทธุรกรรม" : "Type",
                render: (l) => (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/15">
                    {l.transactionType}
                  </span>
                ),
              },
              {
                key: "sku",
                header: "SKU",
                render: (l) => <span className="font-mono font-bold">{l.sku}</span>,
              },
              {
                key: "qtyChange",
                header: isThai ? "จำนวนที่เปลี่ยน" : "Qty Change",
                align: "right",
                render: (l) => (
                  <span
                    className={`font-mono font-bold ${
                      l.qtyChange > 0 ? "text-[#2EC4B6]" : "text-[#E71D36]"
                    }`}
                  >
                    {l.qtyChange > 0 ? `+${l.qtyChange}` : l.qtyChange}
                  </span>
                ),
              },
              {
                key: "balanceAfter",
                header: isThai ? "ยอดคงเหลือหลังทำรายการ" : "Balance",
                align: "right",
                render: (l) => <span className="font-mono font-bold">{l.balanceAfter}</span>,
              },
              {
                key: "operatorName",
                header: isThai ? "ผู้บันทึก" : "Operator",
                render: (l) => <span className="opacity-80">{l.operatorName}</span>,
              },
            ]}
          />
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
                    <span className="font-mono font-bold text-base text-[#6366F1]">{facTotal.toLocaleString()} pcs</span>
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
