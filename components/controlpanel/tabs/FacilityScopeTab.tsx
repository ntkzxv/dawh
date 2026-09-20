"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown, DatePicker } from "@/components/common";
import type { AdminUserRecord, FacilityRecord } from "../types";
import type { FacilityScopeType } from "@/lib/access/types";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Shield,
  Layers,
} from "lucide-react";

interface FacilityScopeTabProps {
  users: AdminUserRecord[];
  facilities: FacilityRecord[];
  onAssignScope: (
    userId: string,
    facilityId: string,
    facilityCode: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null
  ) => void;
  onUpdateScope: (
    userId: string,
    scopeId: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null,
    version: number
  ) => void;
  onRevokeScope: (userId: string, scopeId: string, version: number, reason: string) => void;
  isThai: boolean;
}

export default function FacilityScopeTab({
  users,
  facilities,
  onAssignScope,
  onUpdateScope,
  onRevokeScope,
  isThai,
}: FacilityScopeTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>("ALL");

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState(users[0]?.id || "");
  const [assignFacilityId, setAssignFacilityId] = useState(facilities[0]?.id || "");
  const [assignScopeType, setAssignScopeType] = useState<FacilityScopeType>("OPERATE");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [editingScope, setEditingScope] = useState<{
    user: AdminUserRecord;
    scope: AdminUserRecord["facilityScopes"][0];
  } | null>(null);
  const [editScopeType, setEditScopeType] = useState<FacilityScopeType>("OPERATE");

  const [revokingScope, setRevokingScope] = useState<{
    user: AdminUserRecord;
    scope: AdminUserRecord["facilityScopes"][0];
  } | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Dropdown options
  const userFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ผู้ใช้งานทั้งหมด" : "All Users" },
    ...users.map((u) => ({
      value: u.id,
      label: u.name,
      subLabel: u.email,
    })),
  ], [users, isThai]);

  const facilityFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกสาขา/คลัง" : "All Facilities" },
    ...facilities.map((f) => ({
      value: f.id,
      label: `${f.name} (${f.code})`,
      badge: f.code,
    })),
  ], [facilities, isThai]);

  const assignUserOptions = useMemo(() => {
    return users.map((u) => ({
      value: u.id,
      label: u.name,
      subLabel: u.email,
    }));
  }, [users]);

  const assignFacilityOptions = useMemo(() => {
    return facilities.map((f) => ({
      value: f.id,
      label: `${f.name} (${f.code})`,
      badge: f.code,
    }));
  }, [facilities]);

  const scopeTypeOptions = useMemo(() => [
    { value: "READ" as FacilityScopeType, label: `READ (${isThai ? "อ่านข้อมูลเท่านั้น" : "Read-only"})` },
    { value: "OPERATE" as FacilityScopeType, label: `OPERATE (${isThai ? "ปฏิบัติการคลัง/รับส่ง" : "Operational"})` },
    { value: "APPROVE" as FacilityScopeType, label: `APPROVE (${isThai ? "อนุมัติรายการและเอกสาร" : "Approval Authority"})` },
    { value: "ADMIN" as FacilityScopeType, label: `ADMIN (${isThai ? "ผู้ดูแลและบริหารจัดการสาขา" : "Facility Administrator"})` },
  ], [isThai]);

  // Flattened scopes list for table
  const allScopes = users.flatMap((user) =>
    user.facilityScopes.map((scope) => ({
      user,
      scope,
    }))
  );

  const filteredScopes = allScopes.filter(({ user, scope }) => {
    const matchUser = selectedUserFilter === "ALL" || user.id === selectedUserFilter;
    const matchFacility =
      selectedFacilityFilter === "ALL" || scope.facilityId === selectedFacilityFilter;
    return matchUser && matchFacility;
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const facility = facilities.find((f) => f.id === assignFacilityId);
    if (!facility || !assignUserId) return;

    onAssignScope(
      assignUserId,
      facility.id,
      facility.code,
      assignScopeType,
      validFrom ? new Date(validFrom).toISOString() : null,
      validUntil ? new Date(validUntil).toISOString() : null
    );
    setIsAssignModalOpen(false);
    setValidFrom("");
    setValidUntil("");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScope) return;
    onUpdateScope(
      editingScope.user.id,
      editingScope.scope.id,
      editScopeType,
      editingScope.scope.validFrom,
      editingScope.scope.validUntil,
      editingScope.scope.version
    );
    setEditingScope(null);
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingScope || !revokeReason.trim()) return;
    onRevokeScope(
      revokingScope.user.id,
      revokingScope.scope.id,
      revokingScope.scope.version,
      revokeReason.trim()
    );
    setRevokingScope(null);
    setRevokeReason("");
  };

  const getScopeBadge = (type: FacilityScopeType) => {
    switch (type) {
      case "ADMIN":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400">ADMIN</span>;
      case "APPROVE":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400">APPROVE</span>;
      case "OPERATE":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-400">OPERATE</span>;
      case "READ":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-500/20 text-zinc-400">READ</span>;
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
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การกำหนดขอบเขตสิทธิ์ระดับสาขาและคลังสินค้า" : "Facility Scope & Authority Delegation"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "ควบคุมสิทธิ์การเข้าถึงระดับ READ, OPERATE, APPROVE, ADMIN พร้อมระบบ Optimistic Locking"
                : "Granular scope delegation with versioned optimistic concurrency control"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAssignModalOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
            isLight
              ? "bg-[#222222] hover:bg-black text-white"
              : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
          }`}
        >
          <Plus size={14} />
          <span>{isThai ? "เพิ่มขอบเขตสาขา" : "Add Scope"}</span>
        </button>
      </div>

      {/* Access Verification Formula Explainer Box */}
      <div
        className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
          isLight ? "bg-indigo-50/50 border-indigo-200 text-indigo-950" : "bg-indigo-950/20 border-indigo-500/30 text-indigo-200"
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Layers size={16} className="text-[#6366F1] shrink-0" />
          <span>{isThai ? "หลักเกณฑ์การตรวจสอบสิทธิ์ครบวงจร:" : "Effective Authorization Formula:"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#6366F1]/10 border border-[#6366F1]/20">Role Permissions</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">Facility Scopes</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Account Status</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">Profile Completion</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap gap-3 items-center justify-between transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* User Filter */}
          <div className="min-w-[170px]">
            <CustomDropdown
              value={selectedUserFilter}
              onChange={setSelectedUserFilter}
              options={userFilterOptions}
              searchable={users.length > 5}
              searchPlaceholder={isThai ? "ค้นหาผู้ใช้..." : "Search user..."}
            />
          </div>

          {/* Facility Filter */}
          <div className="min-w-[170px]">
            <CustomDropdown
              value={selectedFacilityFilter}
              onChange={setSelectedFacilityFilter}
              options={facilityFilterOptions}
              searchable={facilities.length > 5}
              searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
            />
          </div>
        </div>

        <span className="text-xs opacity-60 font-semibold">
          {filteredScopes.length} {isThai ? "รายการสิทธิ์ที่กำหนด" : "active scopes"}
        </span>
      </div>

      {/* Scopes Table */}
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
                <th className="p-3">{isThai ? "ผู้ใช้งาน" : "User"}</th>
                <th className="p-3">{isThai ? "สาขา/คลังที่ได้รับมอบหมาย" : "Facility Assigned"}</th>
                <th className="p-3">{isThai ? "ระดับสิทธิ์ขอบเขต" : "Scope Level"}</th>
                <th className="p-3">{isThai ? "เวอร์ชันล็อก" : "Version"}</th>
                <th className="p-3">{isThai ? "ระยะเวลาเริ่มต้น/สิ้นสุด" : "Validity Period"}</th>
                <th className="p-3 text-right">{isThai ? "การดำเนินการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#444444]/30">
              {filteredScopes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center opacity-50 italic">
                    {isThai ? "ไม่พบขอบเขตสิทธิ์ที่ตรงกับตัวกรอง" : "No facility scopes found."}
                  </td>
                </tr>
              ) : (
                filteredScopes.map(({ user, scope }) => {
                  const facility = facilities.find((f) => f.id === scope.facilityId);

                  return (
                    <tr
                      key={scope.id}
                      className={`transition-colors ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="p-3 font-semibold">
                        <div>{user.name}</div>
                        <div className="font-mono text-[10px] opacity-60">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold">{facility?.name || scope.facilityCode}</div>
                        <div className="font-mono text-[10px] opacity-60">{scope.facilityCode}</div>
                      </td>
                      <td className="p-3">{getScopeBadge(scope.scopeType)}</td>
                      <td className="p-3 font-mono font-bold opacity-70">v{scope.version}</td>
                      <td className="p-3 text-[11px] opacity-70">
                        {scope.validUntil
                          ? `${scope.validFrom ? new Date(scope.validFrom).toLocaleDateString() : "Now"} - ${new Date(scope.validUntil).toLocaleDateString()}`
                          : (isThai ? "ไม่มีกำหนดสิ้นสุด" : "Indefinite")}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingScope({ user, scope });
                              setEditScopeType(scope.scopeType);
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                            }`}
                            title={isThai ? "แก้ไขระดับสิทธิ์" : "Edit Scope"}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokingScope({ user, scope })}
                            className="p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                            title={isThai ? "เพิกถอนขอบเขต" : "Revoke Scope"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign Facility Scope */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <h4 className="font-bold text-base">{isThai ? "เพิ่มขอบเขตการเข้าถึงสาขา" : "Assign Facility Scope"}</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "ผู้ใช้งานเป้าหมาย" : "Select User"}</label>
                <CustomDropdown
                  value={assignUserId}
                  onChange={setAssignUserId}
                  options={assignUserOptions}
                  searchable={users.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาผู้ใช้..." : "Search user..."}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "เลือกสาขาหรือคลังสินค้า" : "Select Facility"}</label>
                <CustomDropdown
                  value={assignFacilityId}
                  onChange={setAssignFacilityId}
                  options={assignFacilityOptions}
                  searchable={facilities.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "ระดับสิทธิ์การเข้าถึง" : "Scope Level"}</label>
                <CustomDropdown
                  value={assignScopeType}
                  onChange={(val) => setAssignScopeType(val as FacilityScopeType)}
                  options={scopeTypeOptions}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold opacity-80">{isThai ? "วันเริ่มต้น" : "Valid From"}</label>
                  <DatePicker
                    value={validFrom}
                    onChange={setValidFrom}
                    isThai={isThai}
                    placeholder={isThai ? "เลือกวันเริ่มต้น..." : "Select start date..."}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold opacity-80">{isThai ? "วันสิ้นสุด (ถ้ามี)" : "Valid Until"}</label>
                  <DatePicker
                    value={validUntil}
                    onChange={setValidUntil}
                    isThai={isThai}
                    placeholder={isThai ? "ไม่ระบุ (ตลอดชีพ)..." : "Indefinite..."}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
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
                  {isThai ? "บันทึกขอบเขต" : "Save Scope"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Scope (Optimistic Locking) */}
      {editingScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[440px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">{isThai ? "แก้ไขระดับขอบเขตสาขา" : "Update Facility Scope"}</h4>
              <button
                type="button"
                onClick={() => setEditingScope(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="opacity-60">{isThai ? "ผู้ใช้งาน:" : "User:"} {editingScope.user.name}</span>
                <span className="opacity-60">{isThai ? "สาขา:" : "Facility:"} {editingScope.scope.facilityCode}</span>
                <span className="font-mono text-[11px] opacity-70">
                  {isThai ? "เวอร์ชันปัจจุบัน (Optimistic Lock):" : "Current Version:"} v{editingScope.scope.version}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "ระดับสิทธิ์ใหม่" : "New Scope Level"}</label>
                <CustomDropdown
                  value={editScopeType}
                  onChange={(val) => setEditScopeType(val as FacilityScopeType)}
                  options={scopeTypeOptions}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setEditingScope(null)}
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
                  {isThai ? "อัปเดตระดับสิทธิ์" : "Update Scope"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Facility Scope */}
      {revokingScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={18} />
                <h4 className="font-bold text-base">{isThai ? "เพิกถอนขอบเขตสาขา" : "Revoke Facility Scope"}</h4>
              </div>
              <button
                type="button"
                onClick={() => setRevokingScope(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRevokeSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="opacity-60">{isThai ? "ผู้ใช้งาน:" : "User:"} {revokingScope.user.name}</span>
                <span className="opacity-60">{isThai ? "สาขาที่เพิกถอน:" : "Facility:"} {revokingScope.scope.facilityCode}</span>
                <span className="opacity-60">{isThai ? "ระดับสิทธิ์เดิม:" : "Scope Level:"} {revokingScope.scope.scopeType}</span>
                <span className="font-mono text-[11px] opacity-70">Version: v{revokingScope.scope.version}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "เหตุผลในการเพิกถอนสิทธิ์สาขา (จำเป็นต้องระบุ)" : "Revocation Reason (Mandatory)"}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={isThai ? "ระบุเหตุผลในการเพิกถอนขอบเขต เช่น ย้ายสาขาประจำการ..." : "Enter reason for audit record..."}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none resize-none ${
                    isLight ? "bg-zinc-100 border-zinc-300 focus:border-zinc-800" : "bg-[#333333] border-[#444444] text-white focus:border-zinc-400"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setRevokingScope(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-500/30 hover:bg-white/5 font-medium"
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm"
                >
                  {isThai ? "ยืนยันเพิกถอน" : "Confirm Revoke"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
