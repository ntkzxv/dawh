"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { AdminUserRecord, CanonicalRole, RoleAssignmentHistory } from "../types";
import {
  Shield,
  Check,
  X,
  Plus,
  RotateCcw,
  AlertCircle,
  History,
  Lock,
  Calendar,
  AlertTriangle,
  UserCheck,
  Info,
} from "lucide-react";

interface RoleManagementTabProps {
  roles: CanonicalRole[];
  users: AdminUserRecord[];
  history: RoleAssignmentHistory[];
  onAssignRole: (userId: string, roleId: string, validFrom: string | null, validUntil: string | null) => void;
  onRevokeRole: (userId: string, assignmentId: string, reason: string) => void;
  isThai: boolean;
}

export default function RoleManagementTab({
  roles,
  users,
  history,
  onAssignRole,
  onRevokeRole,
  isThai,
}: RoleManagementTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Sub-tabs: "roles" | "matrix" | "history"
  const [activeSubTab, setActiveSubTab] = useState<"roles" | "matrix" | "history">("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [revokeTarget, setRevokeTarget] = useState<{
    user: AdminUserRecord;
    roleAssignment: AdminUserRecord["roles"][0];
  } | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Active System Admins count for guard
  const activeSystemAdmins = users.filter(
    (u) =>
      u.accountStatus === "ACTIVE" &&
      u.roles.some((r) => r.code === "SYSTEM_ADMINISTRATOR")
  );

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUserId = assignUserId || users[0]?.id;
    const finalRoleId = assignRoleId || roles[0]?.id;
    if (!finalUserId || !finalRoleId) return;
    onAssignRole(
      finalUserId,
      finalRoleId,
      validFrom ? new Date(validFrom).toISOString() : null,
      validUntil ? new Date(validUntil).toISOString() : null
    );
    setIsAssignModalOpen(false);
    setValidFrom("");
    setValidUntil("");
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTarget) return;
    setRevokeError(null);

    // Guard: Protect last System Admin
    if (
      revokeTarget.roleAssignment.code === "SYSTEM_ADMINISTRATOR" &&
      activeSystemAdmins.length <= 1
    ) {
      setRevokeError(
        isThai
          ? "ไม่สามารถเพิกถอนสิทธิ์ได้ เนื่องจากเป็นผู้ดูแลระบบสูงสุดคนสุดท้ายในระบบ"
          : "Cannot revoke the last active System Administrator role."
      );
      return;
    }

    if (!revokeReason.trim()) {
      setRevokeError(isThai ? "กรุณาระบุเหตุผลในการเพิกถอนสิทธิ์" : "Please provide a reason for revoking this role.");
      return;
    }

    onRevokeRole(revokeTarget.user.id, revokeTarget.roleAssignment.assignmentId, revokeReason.trim());
    setRevokeTarget(null);
    setRevokeReason("");
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
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การบริหารบทบาทและสิทธิ์การใช้งาน" : "Role Management & Privilege Assignments"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "ตรวจสอบ 9 บทบาทมาตรฐาน กำหนดช่วงเวลาเริ่มต้น/สิ้นสุด และประวัติการมอบหมาย"
                : "Standard canonical roles, validity period assignments & audit history"}
            </p>
          </div>
        </div>

        {/* Action Button */}
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
          <span>{isThai ? "มอบหมายบทบาทใหม่" : "Assign Role"}</span>
        </button>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b pb-2 border-[#444444]/30">
        <button
          type="button"
          onClick={() => setActiveSubTab("roles")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "roles"
              ? isLight
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-900"
              : isLight
              ? "text-zinc-600 hover:bg-zinc-100"
              : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          {isThai ? "บทบาทและสิทธิ์ที่รองรับ" : "Canonical Roles"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("matrix")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "matrix"
              ? isLight
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-900"
              : isLight
              ? "text-zinc-600 hover:bg-zinc-100"
              : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          {isThai ? "ตารางความสัมพันธ์สิทธิ์" : "Permission Matrix"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("history")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "history"
              ? isLight
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-900"
              : isLight
              ? "text-zinc-600 hover:bg-zinc-100"
              : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          {isThai ? "ประวัติการมอบหมายและเพิกถอน" : "Assignment History"}
        </button>
      </div>

      {/* Sub-Tab 1: Canonical Roles View */}
      {activeSubTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Role List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {roles.map((r) => {
              const isSelected = selectedRole ? selectedRole.id === r.id : false;
              const assignedCount = users.filter((u) => u.roles.some((ur) => ur.code === r.code)).length;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? isLight
                        ? "bg-zinc-100 border-zinc-900 shadow-sm"
                        : "bg-[#444444] border-white shadow-sm"
                      : isLight
                      ? "bg-white border-[#E4E4E7] hover:border-zinc-400"
                      : "bg-[#383838] border-[#444444] hover:border-zinc-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{r.name}</span>
                      {r.isSystemAdmin && (
                        <Shield size={12} className="text-amber-500" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isLight ? "bg-zinc-200 text-zinc-700" : "bg-[#2C2C2C] text-[#E4E4E7]"
                      }`}
                    >
                      {assignedCount} {isThai ? "คน" : "users"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono opacity-60 mt-1">{r.code}</div>
                  <p className="text-[11px] opacity-75 mt-2 line-clamp-2">{r.description}</p>
                </div>
              );
            })}
          </div>

          {/* Role Details and User Assignments */}
          {selectedRole ? (
            <div
              className={`lg:col-span-2 p-5 rounded-xl border flex flex-col gap-4 ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-[#444444]/30">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>{selectedRole.name}</span>
                    <span className="text-xs font-mono opacity-50">({selectedRole.code})</span>
                  </h3>
                  <p className="text-xs opacity-70 mt-1">{selectedRole.description}</p>
                </div>
              </div>

              {/* Permissions list */}
              <div>
                <h4 className="font-bold text-xs mb-2">
                  {isThai ? "สิทธิ์การเข้าถึงในระบบ (Atomic Permissions):" : "Role Permissions Catalog:"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedRole.permissions || []).map((p) => (
                    <span
                      key={p}
                      className={`text-[11px] font-mono px-2 py-1 rounded-md border ${
                        isLight
                          ? "bg-zinc-100 border-zinc-200 text-zinc-800"
                          : "bg-[#2C2C2C] border-[#555555] text-zinc-200"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Currently Assigned Users */}
              <div className="mt-2">
                <h4 className="font-bold text-xs mb-2">
                  {isThai ? "ผู้ใช้งานที่ได้รับมอบหมายบทบาทนี้:" : "Active Role Holders:"}
                </h4>
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isLight ? "border-zinc-200" : "border-[#444444]"
                  }`}
                >
                  {users.filter((u) => u.roles?.some((r) => r.code === selectedRole?.code)).length === 0 ? (
                    <div className="p-4 text-center text-xs opacity-50 italic">
                      {isThai ? "ยังไม่มีผู้ใช้งานได้รับบทบาทนี้" : "No active users assigned to this role."}
                    </div>
                  ) : (
                    users
                      .filter((u) => u.roles?.some((r) => r.code === selectedRole?.code))
                      .map((user) => {
                        const assignment = user.roles?.find((r) => r.code === selectedRole?.code);
                        if (!assignment) return null;
                        return (
                          <div
                            key={user.id}
                            className={`p-3 border-b last:border-0 flex items-center justify-between text-xs ${
                              isLight
                                ? "bg-zinc-50 border-zinc-200"
                                : "bg-[#333333]/40 border-[#444444]"
                            }`}
                          >
                            <div>
                              <span className="font-semibold">{user.name}</span>
                              <span className="opacity-60 ml-2 font-mono">({user.email})</span>
                              <div className="text-[11px] opacity-50 mt-0.5">
                                {assignment.validUntil
                                  ? `Valid until: ${new Date(assignment.validUntil).toLocaleDateString()}`
                                  : (isThai ? "ไม่ระบุวันหมดอายุ" : "Indefinite")}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setRevokeTarget({
                                  user,
                                  roleAssignment: assignment,
                                })
                              }
                              className="px-2.5 py-1 rounded text-red-500 hover:bg-red-500/10 font-bold transition-colors"
                            >
                              {isThai ? "เพิกถอน" : "Revoke"}
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Read-Only Notice as specified in Backend Handoff */}
              <div
                className={`p-3 rounded-lg border text-[11px] flex items-start gap-2 ${
                  isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-900/20 border-amber-500/30 text-amber-300"
                }`}
              >
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  {isThai
                    ? "หมายเหตุ: ระบบยังไม่มี API สำหรับสร้าง role ใหม่หรือแก้ไข permission matrix โดยตรง การแก้ไขสิทธิ์ต้องทำผ่านการอัปเดตระบบหลัก"
                    : "Note: Backend does not currently support creating custom roles or altering the permission matrix from the Admin Panel directly."}
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`lg:col-span-2 p-8 rounded-xl border flex flex-col items-center justify-center text-xs opacity-60 ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              {isThai ? "ยังไม่มีข้อมูลบทบาทในระบบ" : "No roles available"}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Permission Matrix View */}
      {activeSubTab === "matrix" && (
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
                  <th className="p-3 min-w-[200px]">{isThai ? "บทบาทมาตรฐาน" : "Role"}</th>
                  <th className="p-3 text-center">Users Read</th>
                  <th className="p-3 text-center">Users Manage</th>
                  <th className="p-3 text-center">Roles Manage</th>
                  <th className="p-3 text-center">Stock Read</th>
                  <th className="p-3 text-center">Stock Adjust</th>
                  <th className="p-3 text-center">Transfer Appr</th>
                  <th className="p-3 text-center">Audit Read</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#444444]/30">
                {roles.map((r) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="p-3 font-semibold">
                      <div>{r.name}</div>
                      <div className="font-mono text-[10px] opacity-60">{r.code}</div>
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("admin.users.read") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("admin.users.manage") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("admin.roles.manage") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("stock.read") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("stock.adjust") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("transfer.approve") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {r.permissions.includes("audit.read") ? (
                        <Check size={14} className="mx-auto text-[#2EC4B6]" />
                      ) : (
                        <span className="opacity-30">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Assignment History */}
      {activeSubTab === "history" && (
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
                  <th className="p-3">{isThai ? "การดำเนินการ" : "Action"}</th>
                  <th className="p-3">{isThai ? "ผู้ใช้งาน" : "User"}</th>
                  <th className="p-3">{isThai ? "บทบาท" : "Role"}</th>
                  <th className="p-3">{isThai ? "เหตุผล" : "Reason"}</th>
                  <th className="p-3">{isThai ? "ผู้ดำเนินการ" : "Performed By"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#444444]/30">
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className={`transition-colors ${
                      isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="p-3 font-mono opacity-80">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          h.action === "ASSIGN"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {h.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{h.userName}</td>
                    <td className="p-3">
                      <div>{h.roleName}</div>
                      <div className="text-[10px] font-mono opacity-50">{h.roleCode}</div>
                    </td>
                    <td className="p-3 opacity-80">{h.reason || "-"}</td>
                    <td className="p-3 font-mono opacity-70">{h.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Assign Role */}
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
                <h4 className="font-bold text-base">{isThai ? "มอบหมายบทบาทให้ผู้ใช้" : "Assign Role"}</h4>
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
                <label className="font-semibold opacity-80">{isThai ? "เลือกผู้ใช้งาน" : "Select User"}</label>
                <select
                  value={assignUserId || users[0]?.id || ""}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "เลือกบทบาท" : "Select Role"}</label>
                <select
                  value={assignRoleId || roles[0]?.id || ""}
                  onChange={(e) => setAssignRoleId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold opacity-80">{isThai ? "วันเริ่มต้น" : "Valid From"}</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold opacity-80">{isThai ? "วันสิ้นสุด (ถ้ามี)" : "Valid Until"}</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
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
                  {isThai ? "ยืนยันมอบหมาย" : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Role */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={18} />
                <h4 className="font-bold text-base">{isThai ? "เพิกถอนบทบาทสิทธิ์" : "Revoke Role Assignment"}</h4>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRevokeSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="opacity-60">{isThai ? "ผู้ใช้งาน:" : "User:"}</span>
                <span className="font-bold text-sm">{revokeTarget.user.name}</span>
                <span className="opacity-60 mt-1">{isThai ? "บทบาทที่จะเพิกถอน:" : "Role to Revoke:"}</span>
                <span className="font-bold text-red-400">{revokeTarget.roleAssignment.name}</span>
              </div>

              {revokeError && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{revokeError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">{isThai ? "เหตุผลในการเพิกถอน (จำเป็นต้องระบุ)" : "Revocation Reason (Mandatory)"}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={isThai ? "ระบุเหตุผลในการเพิกถอนบทบาทนี้..." : "Reason for enterprise audit record..."}
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
                  onClick={() => setRevokeTarget(null)}
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
