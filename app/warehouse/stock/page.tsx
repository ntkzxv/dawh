"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { CustomDropdown } from "@/components/common";
import { ApiRequestError } from "@/lib/api/client";
import { listNetworkStock, listStockBalances } from "@/lib/api/stock";
import type { NetworkStock, StockBalance } from "@/lib/stock/types";
import {
  Building2,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "replenishing";

type StockBalanceItem = {
  id: string;
  sku: string;
  nameTh: string;
  nameEn: string;
  category: string;
  onHand: number;
  safetyStock: number;
  incoming: number;
  shortage: number;
  unit: string;
  status: StockStatus;
  location: string;
  warehouse: string;
};

function numberValue(value: string) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function statusForBalance(balance: StockBalance): StockStatus {
  const quantity = numberValue(balance.quantity);
  const safety = numberValue(balance.safetyQuantity);
  if (balance.stockStatus === "IN_TRANSIT") return "replenishing";
  if (quantity <= 0) return "out_of_stock";
  if (quantity < safety) return "low_stock";
  return "in_stock";
}

function mapBalance(balance: StockBalance): StockBalanceItem {
  const onHand = numberValue(balance.quantity);
  const safetyStock = numberValue(balance.safetyQuantity);
  return {
    id: balance.id,
    sku: balance.sku,
    nameTh: balance.productNameTh,
    nameEn: balance.productNameEn ?? balance.productNameTh,
    category: balance.category?.name ?? "-",
    onHand,
    safetyStock,
    incoming: balance.stockStatus === "IN_TRANSIT" ? onHand : 0,
    shortage: Math.max(safetyStock - onHand, 0),
    unit: balance.baseUnit.name,
    status: statusForBalance(balance),
    location: balance.locationCode ?? "-",
    warehouse: balance.facilityName,
  };
}

function errorMessage(error: unknown, isThai: boolean) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return isThai
      ? "คุณไม่มีสิทธิ์ดูข้อมูลสต็อก"
      : "You do not have permission to view stock data.";
  }
  return isThai
    ? "ไม่สามารถโหลดข้อมูลสต็อกได้ กรุณาลองใหม่อีกครั้ง"
    : "Unable to load stock data. Please try again.";
}

export default function StockBalancePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [network, setNetwork] = useState<NetworkStock[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<StockBalanceItem | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "ทั้งหมด", label: isThai ? "ทั้งหมด (ทุกสถานะ)" : "All Status" },
      {
        value: "มีสินค้า",
        label: isThai ? "มีสินค้า" : "In Stock",
        badge: isThai ? "พร้อมจำหน่าย" : "Available",
      },
      {
        value: "กำลังเติมสต็อก",
        label: isThai ? "กำลังเติมสต็อก" : "Replenishing",
        badge: isThai ? "ระหว่างทาง" : "In Transit",
      },
      {
        value: "ขาดสต็อก",
        label: isThai ? "ขาดสต็อก" : "Out of Stock",
        badge: isThai ? "หมด" : "Depleted",
      },
    ],
    [isThai],
  );

  const loadData = useCallback(
    async (cursor: string | null, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
        });
        if (cursor) params.set("cursor", cursor);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());

        const [balanceResponse, networkResponse] = await Promise.all([
          listStockBalances(`?${params.toString()}`),
          listNetworkStock(),
        ]);
        if (signal?.aborted) return;

        const data = Array.isArray(balanceResponse.data)
          ? balanceResponse.data.filter(
              (item): item is StockBalance =>
                typeof item === "object" && item !== null,
            )
          : [];
        setBalances(data);
        setNetwork(
          Array.isArray(networkResponse.data)
            ? networkResponse.data.filter(
                (item): item is NetworkStock =>
                  typeof item === "object" && item !== null,
              )
            : [],
        );
        setNextCursor(balanceResponse.page?.nextCursor ?? null);
        setHasMore(balanceResponse.page?.hasMore ?? false);
      } catch (loadError) {
        if (signal?.aborted) return;
        setBalances([]);
        setNetwork([]);
        setNextCursor(null);
        setHasMore(false);
        setError(errorMessage(loadError, isThai));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [isThai, searchQuery],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadData(null, controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadData, statusFilter]);

  const rows = useMemo(() => {
    const mapped = balances.map(mapBalance);
    if (statusFilter === "มีสินค้า") {
      return mapped.filter((row) => row.status === "in_stock" || row.status === "low_stock");
    }
    if (statusFilter === "กำลังเติมสต็อก") {
      return mapped.filter((row) => row.status === "replenishing");
    }
    if (statusFilter === "ขาดสต็อก") {
      return mapped.filter((row) => row.status === "out_of_stock");
    }
    return mapped;
  }, [balances, statusFilter]);

  const totals = useMemo(() => {
    const totalUnits = network.reduce(
      (sum, item) => sum + numberValue(item.physicalOnHand),
      0,
    );
    const availableUnits = network.reduce(
      (sum, item) => sum + numberValue(item.availableQuantity),
      0,
    );
    const byFacility = new Map<string, number>();
    for (const item of network) {
      byFacility.set(
        item.facilityName,
        (byFacility.get(item.facilityName) ?? 0) +
          numberValue(item.physicalOnHand),
      );
    }
    return { totalUnits, availableUnits, byFacility };
  }, [network]);

  const goNext = () => {
    if (!nextCursor || !hasMore) return;
    setCursorHistory((history) => [...history, nextCursor]);
    void loadData(nextCursor);
  };

  const goPrevious = () => {
    const history = [...cursorHistory];
    history.pop();
    const cursor = history.length ? history[history.length - 1] : null;
    setCursorHistory(history);
    void loadData(cursor);
  };

  const refresh = () => {
    setCursorHistory([]);
    void loadData(cursorHistory.length ? cursorHistory[cursorHistory.length - 1] : null);
  };

  const branchSummary = Array.from(totals.byFacility.entries())
    .slice(0, 3)
    .map(([name, quantity]) => `${name} ${quantity.toLocaleString()}`)
    .join(" · ");

  return (
    <WarehousePageTemplate
      titleEn="Stock Balance & Replenishment Status"
      titleTh="ยอดสินค้าคงคลังและสถานะสต็อก"
      routePath="/warehouse/stock"
      iconName="package"
      fullBleed
      metrics={[
        {
          title: isThai ? "รายการสต็อกในหน้านี้" : "Stock Records",
          value: loading ? "—" : `${rows.length.toLocaleString()} รายการ`,
          sub: isThai ? "จากข้อมูลสต็อกจริง" : "From live stock balances",
          color: "#6366F1",
          iconName: "package",
        },
        {
          title: isThai ? "ยอดคงคลังรวม" : "Total On-Hand",
          value: loading ? "—" : `${totals.totalUnits.toLocaleString()} ชิ้น`,
          sub: isThai ? "รวมทุกคลังที่คุณเข้าถึงได้" : "Across accessible facilities",
          color: "#FF9F1C",
          iconName: "layers",
        },
        {
          title: isThai ? "ยอดพร้อมใช้" : "Available Stock",
          value: loading ? "—" : `${totals.availableUnits.toLocaleString()} ชิ้น`,
          sub: isThai ? "จาก stock status AVAILABLE" : "With AVAILABLE status",
          color: "#2EC4B6",
          iconName: "box",
        },
        {
          title: isThai ? "แยกตามคลัง" : "Stock by Facility",
          value: loading ? "—" : `${totals.byFacility.size} คลัง`,
          sub: branchSummary || (isThai ? "ยังไม่มีข้อมูล" : "No facility data"),
          color: "#818CF8",
          iconName: "branches",
        },
      ]}
    >
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        <div className="w-full flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border h-[38px] text-[13px] ${
                isLight
                  ? "bg-white border-[#E4E4E7]"
                  : "bg-[#282828] border-[#444444]"
              }`}
            >
              <Search size={15} className={isLight ? "text-slate-400" : "text-zinc-400"} />
              <input
                type="text"
                placeholder={
                  isThai
                    ? "ค้นหา SKU, ชื่อสินค้า, คลัง..."
                    : "Search SKU, product, facility..."
                }
                value={searchQuery}
                onChange={(event) => {
                  setCursorHistory([]);
                  setSearchQuery(event.target.value);
                }}
                className={`bg-transparent border-none outline-none text-[13px] w-[180px] sm:w-[240px] ${
                  isLight
                    ? "text-slate-900 placeholder:text-slate-400"
                    : "text-white placeholder:text-zinc-500"
                }`}
              />
            </div>
            <CustomDropdown
              value={statusFilter}
              onChange={(value) => {
                setCursorHistory([]);
                setStatusFilter(value);
              }}
              options={statusOptions}
              icon={<Filter size={14} className={isLight ? "text-slate-500" : "text-zinc-400"} />}
              triggerClassName={`h-[38px] rounded-xl text-[13px] font-medium ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-50"
                  : "bg-[#282828] border-[#444444] text-zinc-200 hover:bg-white/5"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-colors ${
              isLight
                ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-50"
                : "bg-[#282828] border-[#444444] text-zinc-200 hover:bg-white/5"
            } disabled:opacity-50`}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>{isThai ? "รีเฟรชข้อมูลสต็อก" : "Refresh Stock"}</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className={`w-full rounded-xl border px-4 py-3 text-sm ${
              isLight
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={refresh} className="font-semibold underline">
                {isThai ? "ลองใหม่" : "Retry"}
              </button>
            </div>
          </div>
        )}

        <div
          className={`w-full rounded-[12px] border overflow-hidden ${
            isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
          }`}
        >
          {loading ? (
            <div className="px-6 py-16 text-center text-sm opacity-60">
              {isThai ? "กำลังโหลดข้อมูลสต็อก..." : "Loading stock data..."}
            </div>
          ) : !error && rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm opacity-60">
              {isThai ? "ไม่พบข้อมูลสต็อก" : "No stock records found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
                <thead>
                  <tr
                    className={`h-[42px] border-b text-[12px] font-semibold text-white select-none ${
                      isLight ? "bg-slate-900 border-slate-800" : "bg-[#282828] border-[#444444]"
                    }`}
                  >
                    <th className="py-2.5 px-4">{isThai ? "รหัสสินค้า" : "SKU & Product"}</th>
                    <th className="py-2.5 px-4">{isThai ? "คลังและที่ตั้ง" : "Warehouse & Location"}</th>
                    <th className="py-2.5 px-4 text-right">{isThai ? "จำนวนสินค้า" : "Quantity"}</th>
                    <th className="py-2.5 px-4 text-center">{isThai ? "สถานะสต็อก" : "Stock Status"}</th>
                    <th className="py-2.5 pl-2 pr-6 text-center w-14" />
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-white/5"}`}>
                  {rows.map((row) => {
                    const status =
                      row.status === "replenishing"
                        ? { bg: "rgba(99,102,241,.12)", color: "#6366F1", th: "กำลังเติมสต็อก", en: "Replenishing" }
                        : row.status === "out_of_stock"
                          ? { bg: "rgba(231,29,54,.12)", color: "#E71D36", th: "สินค้าขาดสต็อก", en: "Out of Stock" }
                          : row.status === "low_stock"
                            ? { bg: "rgba(255,159,28,.12)", color: "#FF9F1C", th: "สินค้าใกล้หมด", en: "Low Stock" }
                            : { bg: "rgba(46,196,182,.12)", color: "#2EC4B6", th: "มีสินค้าในสต็อก", en: "In Stock" };
                    return (
                      <tr key={row.id} className={`transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"}`}>
                        <td className="py-3.5 px-4">
                          <div className={`font-mono font-semibold text-[12.5px] ${isLight ? "text-slate-800" : "text-zinc-200"}`}>{row.sku}</div>
                          <div className={`font-medium text-[13px] truncate max-w-[240px] ${isLight ? "text-slate-900" : "text-white/90"}`}>{isThai ? row.nameTh : row.nameEn}</div>
                          <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{row.category}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={`flex items-center gap-1.5 font-medium ${isLight ? "text-slate-800" : "text-white/90"}`}>
                            <Building2 size={13} className={isLight ? "text-slate-500" : "text-zinc-400"} />
                            <span>{row.warehouse}</span>
                          </div>
                          <div className={`text-[11.5px] font-mono mt-0.5 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{isThai ? "พิกัด" : "Location"} {row.location}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-mono font-bold text-[14px] ${row.onHand > 0 ? (isLight ? "text-emerald-600" : "text-emerald-400") : (isLight ? "text-rose-600" : "text-rose-400")}`}>
                            {row.onHand.toLocaleString()} <span className="text-[11px] font-normal opacity-70">{row.unit}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[6px] text-[11px] font-bold" style={{ backgroundColor: status.bg, color: status.color }}>
                            {isThai ? status.th : status.en}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 pr-6 text-center">
                          <button type="button" onClick={() => setSelectedDetailItem(row)} title={isThai ? "ดูรายละเอียดเพิ่มเติม" : "View Details"} className="p-1 inline-flex text-zinc-500 hover:text-zinc-200">
                            <MoreHorizontal size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && (cursorHistory.length > 0 || hasMore) && (
          <div className="w-full flex justify-end gap-2">
            <button type="button" onClick={goPrevious} disabled={cursorHistory.length === 0} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40">
              {isThai ? "ก่อนหน้า" : "Previous"}
            </button>
            <button type="button" onClick={goNext} disabled={!hasMore} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40">
              {isThai ? "ถัดไป" : "Next"}
            </button>
          </div>
        )}
      </div>

      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#282828] border-[#444444] text-zinc-100"}`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <h3 className="font-bold text-[16px]">{isThai ? "รายละเอียดสินค้าคงคลัง" : "Stock Item Details"}</h3>
              <button type="button" onClick={() => setSelectedDetailItem(null)} className="p-1.5 rounded-lg"><X size={18} /></button>
            </div>
            <div className="py-4 space-y-4 text-[13px]">
              <div><span className="text-[11px] opacity-60">SKU</span><p className="font-mono text-[15px] font-bold">{selectedDetailItem.sku}</p></div>
              <div><span className="text-[11px] opacity-60">{isThai ? "ชื่อสินค้า" : "Product Name"}</span><p className="font-semibold text-[14.5px]">{isThai ? selectedDetailItem.nameTh : selectedDetailItem.nameEn}</p></div>
              <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <div><span className="text-[11px] opacity-60">{isThai ? "ยอดคงคลัง" : "On-Hand Stock"}</span><p className="font-mono text-[16px] font-bold text-emerald-500">{selectedDetailItem.onHand.toLocaleString()} {selectedDetailItem.unit}</p></div>
                <div><span className="text-[11px] opacity-60">{isThai ? "สต็อกขั้นต่ำ" : "Safety Stock"}</span><p className="font-mono text-[16px]">{selectedDetailItem.safetyStock.toLocaleString()} {selectedDetailItem.unit}</p></div>
              </div>
            </div>
            <div className={`pt-4 border-t flex justify-end ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <button type="button" onClick={() => setSelectedDetailItem(null)} className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-slate-900 text-white">{isThai ? "ปิดหน้าต่าง" : "Close"}</button>
            </div>
          </div>
        </div>
      )}
    </WarehousePageTemplate>
  );
}
