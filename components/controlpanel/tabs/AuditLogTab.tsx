"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown } from "@/components/common";
import type { AuditLogCategoryKey, AuditLogRecord } from "../types";
import {
  Search,
  Shield,
  Building,
  Package,
  Activity,
  ScrollText,
  Clock,
  User,
  RotateCw,
  ExternalLink,
  X,
  Copy,
  Check,
  Filter,
  ArrowRight,
  Database,
  MapPin,
  Laptop,
} from "lucide-react";

interface AuditLogTabProps {
  logs: AuditLogRecord[];
  isLoading?: boolean;
  onRefresh?: () => void;
  selectedCategory: AuditLogCategoryKey;
  onSelectCategory: (category: AuditLogCategoryKey) => void;
  isThai: boolean;
}

export default function AuditLogTab({
  logs,
  isLoading = false,
  onRefresh,
  selectedCategory,
  onSelectCategory,
  isThai,
}: AuditLogTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>("ALL");
  const [inspectingLog, setInspectingLog] = useState<AuditLogRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Category Definitions
  const categories: Array<{
    id: AuditLogCategoryKey;
    labelTh: string;
    labelEn: string;
    icon: React.ElementType;
  }> = [
    { id: "all", labelTh: "ทั้งหมด", labelEn: "All Activity", icon: ScrollText },
    { id: "security", labelTh: "ความปลอดภัยและสิทธิ์", labelEn: "Security & RBAC", icon: Shield },
    { id: "organization", labelTh: "โครงสร้างและผังคลัง", labelEn: "Facility & Topology", icon: Building },
    { id: "products", labelTh: "สินค้าและข้อมูลหลัก", labelEn: "Product Master", icon: Package },
    { id: "inventory", labelTh: "คลังและเกณฑ์สต็อก", labelEn: "Stock & Rules", icon: Activity },
  ];

  // Unique Entity Types
  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.entityType) set.add(l.entityType);
    });
    return Array.from(set).sort();
  }, [logs]);

  const entityTypeOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกประเภทเอนทิตี" : "All Entity Types" },
    ...entityTypes.map((et) => ({
      value: et,
      label: et,
    })),
  ], [entityTypes, isThai]);

  // Filter logs by selectedCategory and search
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category Match
      if (selectedCategory === "security") {
        const isSec =
          log.entityType.includes("user") ||
          log.entityType.includes("role") ||
          log.entityType.includes("scope") ||
          log.action.startsWith("user.") ||
          log.action.startsWith("role.") ||
          log.action.startsWith("facility_scope.");
        if (!isSec) return false;
      } else if (selectedCategory === "organization") {
        const isOrg =
          log.entityType.includes("facility") ||
          log.entityType.includes("location") ||
          log.entityType.includes("department") ||
          log.action.startsWith("facility.") ||
          log.action.startsWith("location.") ||
          log.action.startsWith("department.");
        if (!isOrg) return false;
      } else if (selectedCategory === "products") {
        const isProd =
          log.entityType.includes("product") ||
          log.entityType.includes("category") ||
          log.entityType.includes("brand") ||
          log.entityType.includes("unit") ||
          log.entityType.includes("reason_code") ||
          log.action.startsWith("product.") ||
          log.action.startsWith("category.") ||
          log.action.startsWith("brand.") ||
          log.action.startsWith("uom.") ||
          log.action.startsWith("reason_code.");
        if (!isProd) return false;
      } else if (selectedCategory === "inventory") {
        const isInv =
          log.entityType.includes("stock") ||
          log.entityType.includes("inventory") ||
          log.entityType.includes("safety_stock") ||
          log.action.startsWith("stock.") ||
          log.action.startsWith("safety_stock.");
        if (!isInv) return false;
      }

      // Entity Filter
      if (selectedEntityFilter !== "ALL" && log.entityType !== selectedEntityFilter) {
        return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = (log.actorName || "") + " " + (log.actorEmail || "");
        const match =
          actor.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.entityType.toLowerCase().includes(q) ||
          (log.facilityName || "").toLowerCase().includes(q) ||
          (log.facilityCode || "").toLowerCase().includes(q) ||
          log.requestId.toLowerCase().includes(q) ||
          (log.ipAddress || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [logs, selectedCategory, selectedEntityFilter, searchQuery]);


  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return isoString;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("revoke") || action.includes("delete") || action.includes("suspend")) {
      return isLight
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-rose-950/40 text-rose-300 border-rose-800/40";
    }
    if (action.includes("create") || action.includes("assign") || action.includes("activate")) {
      return isLight
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-emerald-950/40 text-emerald-300 border-emerald-800/40";
    }
    if (action.includes("update") || action.includes("change")) {
      return isLight
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-blue-950/40 text-blue-300 border-blue-800/40";
    }
    return isLight
      ? "bg-zinc-100 text-zinc-700 border-zinc-200"
      : "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="flex flex-1 items-center gap-2.5 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? "text-zinc-400" : "text-zinc-500"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isThai
                  ? "ค้นหาด้วยผู้กระทำ, แอ็กชัน, เอนทิตี, IP หรือ Request ID..."
                  : "Search actor, action, entity, IP or Request ID..."
              }
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border transition-colors outline-none focus:ring-2 ${
                isLight
                  ? "bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white focus:ring-zinc-300"
                  : "bg-[#2A2A2A] border-[#444444] text-white focus:bg-[#222222] focus:ring-zinc-700"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Entity Type Filter */}
          <div className="min-w-[170px]">
            <CustomDropdown
              value={selectedEntityFilter}
              onChange={setSelectedEntityFilter}
              options={entityTypeOptions}
              icon={<Filter size={13} className={isLight ? "text-zinc-500" : "text-zinc-400"} />}
              searchable={entityTypes.length > 5}
              searchPlaceholder={isThai ? "ค้นหาประเภท..." : "Search type..."}
            />
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 disabled:opacity-50"
                  : "bg-[#444444] hover:bg-[#505050] text-white disabled:opacity-50"
              }`}
            >
              <RotateCw size={13} className={isLoading ? "animate-spin" : ""} />
              <span>{isThai ? "รีเฟรช" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b transition-colors font-bold uppercase tracking-wider ${
                  isLight
                    ? "bg-zinc-50/80 text-zinc-500 border-zinc-200"
                    : "bg-[#303030] text-zinc-400 border-[#444444]"
                }`}
              >
                <th className="py-3.5 px-4">{isThai ? "วันเวลา" : "Occurred At"}</th>
                <th className="py-3.5 px-4">{isThai ? "ผู้กระทำ" : "Actor"}</th>
                <th className="py-3.5 px-4">{isThai ? "กิจกรรม / แอ็กชัน" : "Action"}</th>
                <th className="py-3.5 px-4">{isThai ? "เอนทิตี" : "Entity Type"}</th>
                <th className="py-3.5 px-4">{isThai ? "สาขา / ขอบเขต" : "Facility Scope"}</th>
                <th className="py-3.5 px-4">{isThai ? "IP Address" : "IP Address"}</th>
                <th className="py-3.5 px-4 text-right">{isThai ? "รายละเอียด" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ScrollText size={32} className="opacity-40" />
                      <p className="text-sm font-semibold">
                        {isThai ? "ไม่พบบันทึกกิจกรรมตามเงื่อนไข" : "No audit records found matching criteria"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {isThai ? "ลองเปลี่ยนหมวดหมู่หรือคำค้นหา" : "Try changing category or search terms"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionClass = getActionColor(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-700/30 ${
                        inspectingLog?.id === log.id
                          ? isLight
                            ? "bg-blue-50/50"
                            : "bg-blue-950/20"
                          : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300">
                          <Clock size={12} className="opacity-60" />
                          <span>{formatDateTime(log.occurredAt)}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isLight ? "bg-zinc-200 text-zinc-700" : "bg-[#282828] text-zinc-300"
                            }`}
                          >
                            {(log.actorName || log.actorEmail || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate max-w-[150px] leading-tight">
                              {log.actorName || log.actorEmail || (isThai ? "ระบบอัตโนมัติ" : "System")}
                            </span>
                            {log.actorEmail && log.actorName && (
                              <span className="text-[10.5px] text-zinc-400 truncate max-w-[150px] leading-tight">
                                {log.actorEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${actionClass}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="text-[10px] px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-normal">
                              #{log.entityId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Facility */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.facilityCode ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                            <MapPin size={11} className="text-zinc-400 shrink-0" />
                            <span className="font-bold">{log.facilityCode}</span>
                            {log.facilityName && (
                              <span className="truncate max-w-[120px]">({log.facilityName})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">
                            {isThai ? "ส่วนกลาง / องค์กร" : "HQ / Global"}
                          </span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                        {log.ipAddress || "-"}
                      </td>

                      {/* Details / Inspect */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingLog(log)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isLight
                              ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                              : "bg-[#484848] hover:bg-[#555555] text-white"
                          }`}
                        >
                          <ExternalLink size={12} />
                          <span>{isThai ? "ดูรายละเอียด" : "Details"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal / Drawer */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#252525] border-[#444444]"
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isLight ? "bg-slate-100 text-slate-900" : "bg-[#383838] text-white"
                  }`}
                >
                  <ScrollText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      {isThai ? "รายละเอียดบันทึกกิจกรรม" : "Audit Event Details"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold ${getActionColor(
                        inspectingLog.action,
                      )}`}
                    >
                      {inspectingLog.action}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Request ID: {inspectingLog.requestId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444]"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
                    {isThai ? "เวลาที่บันทึก" : "Occurred At"}
                  </span>
                  <span className="font-semibold">{formatDateTime(inspectingLog.occurredAt)}</span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444]"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
                    {isThai ? "ผู้กระทำ (Actor)" : "Actor User"}
                  </span>
                  <span className="font-semibold truncate block">
                    {inspectingLog.actorName || inspectingLog.actorEmail || "SYSTEM"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444]"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
                    {isThai ? "ประเภทเอนทิตี" : "Entity Type"}
                  </span>
                  <span className="font-semibold">{inspectingLog.entityType}</span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444]"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
                    {isThai ? "IP Address" : "IP Address"}
                  </span>
                  <span className="font-semibold">{inspectingLog.ipAddress || "-"}</span>
                </div>
              </div>

              {/* User Agent */}
              {inspectingLog.userAgent && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                    isLight ? "bg-zinc-50 border-zinc-200 text-zinc-600" : "bg-[#2C2C2C] border-[#444444] text-zinc-400"
                  }`}
                >
                  <Laptop size={14} className="shrink-0" />
                  <span className="truncate">{inspectingLog.userAgent}</span>
                </div>
              )}

              {/* Diff View: Old vs New Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Values */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {isThai ? "ค่าข้อมูลเดิม (Old Values)" : "Old Values"}
                    </span>
                    {inspectingLog.oldValues && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(inspectingLog.oldValues, null, 2),
                            "old_values",
                          )
                        }
                        className="text-[11px] font-mono flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                      >
                        {copiedKey === "old_values" ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedKey === "old_values" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-mono max-h-[260px] overflow-y-auto ${
                      isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#1C1C1C] border-[#383838]"
                    }`}
                  >
                    {inspectingLog.oldValues ? (
                      <pre className="whitespace-pre-wrap break-all text-[11.5px] leading-relaxed">
                        {JSON.stringify(inspectingLog.oldValues, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-zinc-400 italic">
                        {isThai ? "(ไม่มีข้อมูลเดิม - เป็นรายการสร้างใหม่)" : "(None - New Record Created)"}
                      </span>
                    )}
                  </div>
                </div>

                {/* New Values */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {isThai ? "ค่าข้อมูลใหม่ (New Values)" : "New Values"}
                    </span>
                    {inspectingLog.newValues && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(inspectingLog.newValues, null, 2),
                            "new_values",
                          )
                        }
                        className="text-[11px] font-mono flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                      >
                        {copiedKey === "new_values" ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{copiedKey === "new_values" ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-mono max-h-[260px] overflow-y-auto ${
                      isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#1C1C1C] border-[#383838]"
                    }`}
                  >
                    {inspectingLog.newValues ? (
                      <pre className="whitespace-pre-wrap break-all text-[11.5px] leading-relaxed">
                        {JSON.stringify(inspectingLog.newValues, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-zinc-400 italic">
                        {isThai ? "(ไม่มีข้อมูลใหม่ - เป็นรายการถูกเพิกถอน/ลบ)" : "(None - Revoked or Deleted)"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                {isThai ? "ปิดหน้าต่าง" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
