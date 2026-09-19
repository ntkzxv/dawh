"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { SafetyStockRuleRecord, FacilityRecord, ProductRecord } from "../types";
import {
  ShieldAlert,
  Plus,
  Edit,
  AlertTriangle,
  CheckCircle,
  X,
  Building,
  TrendingDown,
  Info,
} from "lucide-react";

interface SafetyStockTabProps {
  rules: SafetyStockRuleRecord[];
  facilities: FacilityRecord[];
  products: ProductRecord[];
  onAddRule: (rule: Partial<SafetyStockRuleRecord>) => void;
  onUpdateRule: (id: string, rule: Partial<SafetyStockRuleRecord>) => void;
  isThai: boolean;
}

export default function SafetyStockTab({
  rules,
  facilities,
  products,
  onAddRule,
  onUpdateRule,
  isThai,
}: SafetyStockTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [selectedFacility, setSelectedFacility] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SafetyStockRuleRecord | null>(null);

  const [formFacilityId, setFormFacilityId] = useState(facilities[0]?.id || "");
  const [formProductId, setFormProductId] = useState(products[0]?.id || "");
  const [minQty, setMinQty] = useState(10);
  const [maxQty, setMaxQty] = useState(100);
  const [reorderPoint, setReorderPoint] = useState(25);
  const [safetyQty, setSafetyQty] = useState(15);

  const filteredRules = rules.filter(
    (r) => selectedFacility === "ALL" || r.facilityId === selectedFacility
  );

  const criticalCount = rules.filter((r) => r.currentBalance <= r.safetyQty).length;
  const warningCount = rules.filter(
    (r) => r.currentBalance > r.safetyQty && r.currentBalance <= r.reorderPoint
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const facility = facilities.find((f) => f.id === formFacilityId);
    const product = products.find((p) => p.id === formProductId);
    if (!facility || !product) return;

    const payload: Partial<SafetyStockRuleRecord> = {
      facilityId: facility.id,
      facilityCode: facility.code,
      facilityName: facility.name,
      productId: product.id,
      productSku: product.sku,
      productName: isThai ? product.nameTh : product.nameEn,
      minQty,
      maxQty,
      reorderPoint,
      safetyQty,
      currentBalance: editingRule ? editingRule.currentBalance : Math.floor(Math.random() * 50) + 10,
    };

    if (editingRule) {
      onUpdateRule(editingRule.id, payload);
      setEditingRule(null);
    } else {
      onAddRule(payload);
      setIsModalOpen(false);
    }
  };

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
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การกำหนดเกณฑ์สต็อกปลอดภัยและการสั่งซื้อซ้ำ" : "Safety Stock & Buffer Quantity Configuration"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "ตั้งค่าจุดสั่งซื้อซ้ำ (Reorder Point) สต็อกกันชนฉุกเฉิน และเกณฑ์ขั้นต่ำ/ขั้นสูงรายสาขา"
                : "Automated thresholds: reorder points, buffer minimums & critical shortage alarms"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormFacilityId(facilities[0]?.id || "");
            setFormProductId(products[0]?.id || "");
            setMinQty(10);
            setMaxQty(100);
            setReorderPoint(25);
            setSafetyQty(15);
            setEditingRule(null);
            setIsModalOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
            isLight ? "bg-[#222222] hover:bg-black text-white" : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
          }`}
        >
          <Plus size={14} />
          <span>{isThai ? "ตั้งค่าเกณฑ์ใหม่" : "Add Rule"}</span>
        </button>
      </div>

      {/* Critical Alarm Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            criticalCount > 0
              ? isLight ? "bg-red-50 border-red-200 text-red-900" : "bg-red-950/20 border-red-500/30 text-red-300"
              : isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/20 text-red-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{criticalCount} {isThai ? "รายการ" : "SKUs"}</div>
            <div className="text-xs font-semibold">
              {isThai ? "สต็อกต่ำกว่าระดับปลอดภัยขั้นวิกฤต" : "Critical Shortage (Below Safety Buffer)"}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            warningCount > 0
              ? isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-950/20 border-amber-500/30 text-amber-300"
              : isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-500">
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{warningCount} {isThai ? "รายการ" : "SKUs"}</div>
            <div className="text-xs font-semibold">
              {isThai ? "ถึงจุดควรสั่งซื้อซ้ำ (Reorder Point)" : "Near Reorder Point Threshold"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="opacity-70 font-semibold">{isThai ? "กรองตามสาขา/คลัง:" : "Facility Filter:"}</span>
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border outline-none ${
              isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444] text-white"
            }`}
          >
            <option value="ALL">{isThai ? "ทุกสาขา/คลัง" : "All Facilities"}</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>

        <span className="opacity-60">{filteredRules.length} {isThai ? "เกณฑ์ที่กำหนด" : "rules active"}</span>
      </div>

      {/* Rules Table */}
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
                <th className="p-3 text-right">{isThai ? "ขั้นต่ำ (Min)" : "Min"}</th>
                <th className="p-3 text-right">{isThai ? "จุดสั่งซื้อ (Reorder)" : "Reorder Point"}</th>
                <th className="p-3 text-right">{isThai ? "สำรองฉุกเฉิน (Safety)" : "Safety Qty"}</th>
                <th className="p-3 text-right">{isThai ? "ขั้นสูง (Max)" : "Max"}</th>
                <th className="p-3 text-right">{isThai ? "ยอดคงเหลือจริง" : "Current Balance"}</th>
                <th className="p-3">{isThai ? "สถานะการแจ้งเตือน" : "Alert Status"}</th>
                <th className="p-3 text-right">{isThai ? "จัดการ" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#444444]/30">
              {filteredRules.map((r) => {
                const isCritical = r.currentBalance <= r.safetyQty;
                const isWarning = !isCritical && r.currentBalance <= r.reorderPoint;

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-[#0D99FF]">{r.productSku}</td>
                    <td className="p-3 font-semibold">{r.productName}</td>
                    <td className="p-3 font-mono font-bold opacity-80">{r.facilityCode}</td>
                    <td className="p-3 text-right font-mono">{r.minQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#FF9F1C]">{r.reorderPoint}</td>
                    <td className="p-3 text-right font-mono font-bold text-red-400">{r.safetyQty}</td>
                    <td className="p-3 text-right font-mono">{r.maxQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-base">{r.currentBalance}</td>
                    <td className="p-3">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E71D36]/20 text-[#E71D36] flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E71D36]" />
                          {isThai ? "วิกฤต (ต่ำกว่าสำรอง)" : "CRITICAL"}
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF9F1C]/20 text-[#FF9F1C] flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F1C]" />
                          {isThai ? "ควรสั่งซื้อเพิ่ม" : "REORDER"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2EC4B6]/20 text-[#2EC4B6] flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6]" />
                          {isThai ? "ปกติ" : "OPTIMAL"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRule(r);
                          setFormFacilityId(r.facilityId);
                          setFormProductId(r.productId);
                          setMinQty(r.minQty);
                          setMaxQty(r.maxQty);
                          setReorderPoint(r.reorderPoint);
                          setSafetyQty(r.safetyQty);
                          setIsModalOpen(true);
                        }}
                        className={`p-1.5 rounded ${
                          isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                        }`}
                      >
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Safety Stock Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">
                {editingRule ? (isThai ? "แก้ไขเกณฑ์สต็อกปลอดภัย" : "Edit Safety Rule") : (isThai ? "ตั้งค่าเกณฑ์สต็อกปลอดภัยใหม่" : "Add Safety Stock Rule")}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "เลือกสาขา/คลัง" : "Facility"}</label>
                <select
                  value={formFacilityId}
                  onChange={(e) => setFormFacilityId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "เลือกสินค้า SKU" : "Product SKU"}</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {isThai ? p.nameTh : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "จุดสั่งซื้อซ้ำ (Reorder Point)" : "Reorder Point"}</label>
                  <input
                    type="number"
                    required
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "สต็อกสำรองวิกฤต (Safety Qty)" : "Safety Qty"}</label>
                  <input
                    type="number"
                    required
                    value={safetyQty}
                    onChange={(e) => setSafetyQty(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "สต็อกต่ำสุด (Min Qty)" : "Min Quantity"}</label>
                  <input
                    type="number"
                    required
                    value={minQty}
                    onChange={(e) => setMinQty(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "สต็อกสูงสุด (Max Qty)" : "Max Quantity"}</label>
                  <input
                    type="number"
                    required
                    value={maxQty}
                    onChange={(e) => setMaxQty(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-500/30 hover:bg-white/5 font-medium"
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                    isLight ? "bg-zinc-900 hover:bg-black text-white" : "bg-white hover:bg-zinc-200 text-zinc-900"
                  }`}
                >
                  {isThai ? "บันทึกเกณฑ์" : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
