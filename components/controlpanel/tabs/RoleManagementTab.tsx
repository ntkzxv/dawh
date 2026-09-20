"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { AdminUserRecord, CanonicalRole, RoleAssignmentHistory, RoleSubTabKey } from "../types";
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
  Search,
  Filter,
  Users,
  Building,
  Layers,
  ChevronDown,
} from "lucide-react";
import { CustomDropdown } from "@/components/common";

interface RoleManagementTabProps {
  roles: CanonicalRole[];
  users: AdminUserRecord[];
  history: RoleAssignmentHistory[];
  onAssignRole: (userId: string, roleId: string, validFrom: string | null, validUntil: string | null) => void;
  onRevokeRole: (userId: string, assignmentId: string, reason: string) => void;
  isThai: boolean;
  activeSubTab?: RoleSubTabKey;
  onSubTabChange?: (subTab: RoleSubTabKey) => void;
}

export default function RoleManagementTab({
  roles,
  users,
  history,
  onAssignRole,
  onRevokeRole,
  isThai,
  activeSubTab,
  onSubTabChange,
}: RoleManagementTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Sub-tabs: "assignments" | "roles" | "matrix" | "history" (controlled via Sidebar dropdown)
  const currentSubTab = activeSubTab ?? "assignments";

  // Selected canonical role for canonical view
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // ==========================================================================
  // Filter & Search States for Role Assignments Tab
  // ==========================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFacilityFilter, setDeptFacilityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  // Active System Admins count for safety guard
  const activeSystemAdmins = useMemo(
    () =>
      users.filter(
        (u) =>
          u.accountStatus === "ACTIVE" &&
          u.roles?.some((r) => r.code === "SYSTEM_ADMINISTRATOR")
      ),
    [users]
  );

  // Metrics for Summary Cards
  const totalUsersCount = users.length;
  const assignedUsersCount = useMemo(
    () => users.filter((u) => u.roles && u.roles.length > 0).length,
    [users]
  );
  const unassignedUsersCount = totalUsersCount - assignedUsersCount;
  const totalAssignmentsCount = useMemo(
    () => users.reduce((acc, u) => acc + (u.roles?.length || 0), 0),
    [users]
  );

  // Distinct department & facility options for dropdown filter
  const deptFacilityOptions = useMemo(() => {
    const list: Array<{ id: string; label: string; type: "dept" | "facility" }> = [];
    const seen = new Set<string>();

    users.forEach((u) => {
      if (u.department && !seen.has(`d-${u.department.id}`)) {
        seen.add(`d-${u.department.id}`);
        list.push({
          id: u.department.id,
          label: `${isThai ? "แผนก: " : "Dept: "}${u.department.name}`,
          type: "dept",
        });
      }
      if (u.facility && !seen.has(`f-${u.facility.id}`)) {
        seen.add(`f-${u.facility.id}`);
        list.push({
          id: u.facility.id,
          label: `${isThai ? "สาขา: " : "Facility: "}${u.facility.name}`,
          type: "facility",
        });
      }
    });

    return list;
  }, [users, isThai]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (roleFilter !== "ALL") count++;
    if (deptFacilityFilter !== "ALL") count++;
    if (statusFilter !== "ALL") count++;
    return count;
  }, [searchQuery, roleFilter, deptFacilityFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setDeptFacilityFilter("ALL");
    setStatusFilter("ALL");
  };

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesUsername = u.username?.toLowerCase().includes(q) || false;
        const matchesRole = u.roles?.some(
          (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
        );
        const matchesDept = u.department?.name.toLowerCase().includes(q) || false;
        const matchesFacility = u.facility?.name.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesEmail && !matchesUsername && !matchesRole && !matchesDept && !matchesFacility) {
          return false;
        }
      }

      // 2. Role Filter
      if (roleFilter === "UNASSIGNED") {
        if (u.roles && u.roles.length > 0) return false;
      } else if (roleFilter !== "ALL") {
        const hasRole = u.roles?.some(
          (r) => r.code === roleFilter || r.roleId === roleFilter
        );
        if (!hasRole) return false;
      }

      // 3. Dept / Facility Filter
      if (deptFacilityFilter !== "ALL") {
        const matchesDept = u.department?.id === deptFacilityFilter || u.department?.name === deptFacilityFilter;
        const matchesFac = u.facility?.id === deptFacilityFilter || u.facility?.name === deptFacilityFilter;
        if (!matchesDept && !matchesFac) return false;
      }

      // 4. Status Filter
      if (statusFilter !== "ALL") {
        if (u.accountStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, deptFacilityFilter, statusFilter]);

  // Dropdown options for filter toolbar
  const roleDropdownOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกบทบาท (ทั้งหมด)" : "All Roles" },
    { value: "UNASSIGNED", label: isThai ? "ยังไม่กำหนดบทบาท" : "Unassigned Only" },
    ...roles.map((r) => ({
      value: r.code,
      label: r.name,
      badge: r.code,
    })),
  ], [roles, isThai]);

  const deptFacilityDropdownOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกแผนกและสาขา" : "All Depts & Facilities" },
    ...deptFacilityOptions.map((opt) => ({
      value: opt.id,
      label: opt.label,
      badge: opt.type === "dept" ? (isThai ? "แผนก" : "Dept") : (isThai ? "สาขา" : "Facility"),
    })),
  ], [deptFacilityOptions, isThai]);

  const statusDropdownOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกสถานะ" : "All Status" },
    { value: "ACTIVE", label: isThai ? "ใช้งานปกติ" : "Active" },
    { value: "SUSPENDED", label: isThai ? "ระงับชั่วคราว" : "Suspended" },
    { value: "LOCKED", label: isThai ? "ถูกล็อค" : "Locked" },
  ], [isThai]);

  // Dropdown options for Assign Role Modal
  const modalUserOptions = useMemo(() => {
    return users.map((u) => ({
      value: u.id,
      label: u.name,
      subLabel: `${u.email}${u.username ? ` (@${u.username})` : ""}`,
    }));
  }, [users]);

  // Open modal with preselected user
  const openAssignModalForUser = (user?: AdminUserRecord) => {
    const targetUser = user || users[0];
    if (targetUser) {
      setAssignUserId(targetUser.id);
      const existingRoleIds = new Set(targetUser.roles?.map((r) => r.roleId || r.code));
      const firstAvailableRole = roles.find((r) => !existingRoleIds.has(r.id) && !existingRoleIds.has(r.code));
      setAssignRoleId(firstAvailableRole ? firstAvailableRole.id : roles[0]?.id || "");
    } else {
      setAssignUserId("");
      setAssignRoleId(roles[0]?.id || "");
    }
    setValidFrom("");
    setValidUntil("");
    setIsAssignModalOpen(true);
  };

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

  // Selected user inside Assign Modal
  const modalTargetUser = useMemo(
    () => users.find((u) => u.id === assignUserId) || users[0],
    [users, assignUserId]
  );

  const modalRoleOptions = useMemo(() => {
    return roles.map((r) => {
      const alreadyHas = modalTargetUser?.roles?.some(
        (ur) => ur.code === r.code || ur.roleId === r.id
      );
      return {
        value: r.id,
        label: r.name,
        subLabel: `${r.code}${alreadyHas ? (isThai ? " • มีสิทธิ์นี้แล้ว" : " • Already Assigned") : ""}`,
        badge: alreadyHas ? (isThai ? "ถือครองแล้ว" : "Assigned") : undefined,
        disabled: alreadyHas,
      };
    });
  }, [roles, modalTargetUser, isThai]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 px-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isLight ? "bg-zinc-100 text-zinc-800" : "bg-[#2C2C2C] text-white"
            }`}
          >
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {currentSubTab === "assignments"
                ? isThai
                  ? "การมอบหมายบทบาทพนักงาน"
                  : "Employee Role Assignments"
                : currentSubTab === "roles"
                ? isThai
                  ? "บทบาทมาตรฐานและสิทธิ์ที่รองรับ"
                  : "Canonical Roles & Permissions"
                : currentSubTab === "matrix"
                ? isThai
                  ? "ตารางความสัมพันธ์สิทธิ์"
                  : "Permission Matrix"
                : isThai
                ? "ประวัติการมอบหมายและเพิกถอน"
                : "Assignment Audit History"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {currentSubTab === "assignments"
                ? isThai
                  ? "มอบหมายและจัดการบทบาทผู้ใช้งาน ตรวจสอบสถานะการถือครองสิทธิ์ และเพิกถอนสิทธิ์"
                  : "Allocate roles, view active holders, assign new roles, or revoke access."
                : currentSubTab === "roles"
                ? isThai
                  ? "ตรวจสอบ 9 บทบาทมาตรฐาน กำหนดสิทธิ์ และผู้ถือครองแต่ละบทบาท"
                  : "Review standard canonical roles, active holders & permission catalogs."
                : currentSubTab === "matrix"
                ? isThai
                  ? "ตารางเปรียบเทียบสิทธิ์การเข้าถึง (Atomic Permissions) ของแต่ละบทบาทในระบบ"
                  : "Comparative matrix of atomic RBAC permissions per canonical role."
                : isThai
                ? "บันทึกประวัติการมอบหมายและเพิกถอนสิทธิ์ย้อนหลังเพื่อความโปร่งใสของระบบ"
                : "Historical audit records of all role grants and revocations."}
            </p>
          </div>
        </div>

        {/* Global Action Button (shown in assignments and roles views) */}
        {(currentSubTab === "assignments" || currentSubTab === "roles") && (
          <button
            type="button"
            onClick={() => openAssignModalForUser()}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
              isLight
                ? "bg-[#222222] hover:bg-black text-white"
                : "bg-white hover:bg-zinc-200 text-zinc-900 border border-white"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "มอบหมายบทบาทใหม่" : "Assign Role"}</span>
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* Sub-Tab 1: Role Assignments (User List & Role Allocation View)       */}
      {/* ==================================================================== */}
      {currentSubTab === "assignments" && (
        <div className="flex flex-col gap-4 w-full">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total Users */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isLight ? "bg-zinc-100 text-zinc-800" : "bg-[#2C2C2C] text-white"
                }`}
              >
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] opacity-60 font-medium truncate">
                  {isThai ? "พนักงานทั้งหมด" : "Total Users"}
                </div>
                <div className="text-base font-bold leading-tight mt-0.5">
                  {totalUsersCount} {isThai ? "คน" : ""}
                </div>
              </div>
            </div>

            {/* Card 2: Users with Roles */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#2EC4B6]/15 text-[#2EC4B6]`}
              >
                <UserCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] opacity-60 font-medium truncate">
                  {isThai ? "มอบหมายบทบาทแล้ว" : "Assigned Roles"}
                </div>
                <div className="text-base font-bold leading-tight mt-0.5 text-[#2EC4B6]">
                  {assignedUsersCount} {isThai ? "คน" : ""}
                  <span className="text-[11px] opacity-60 font-normal ml-1">
                    ({totalAssignmentsCount} {isThai ? "สิทธิ์" : "grants"})
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Unassigned Users */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isLight
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-[#2C2C2C] text-zinc-300"
                }`}
              >
                <AlertCircle size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] opacity-60 font-medium truncate">
                  {isThai ? "ยังไม่กำหนดบทบาท" : "Unassigned Users"}
                </div>
                <div
                  className={`text-base font-bold leading-tight mt-0.5 ${
                    isLight ? "text-zinc-900" : "text-white"
                  }`}
                >
                  {unassignedUsersCount} {isThai ? "คน" : ""}
                </div>
              </div>
            </div>

            {/* Card 4: System Administrators */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isLight
                    ? "bg-zinc-100 text-zinc-800"
                    : "bg-[#2C2C2C] text-zinc-200"
                }`}
              >
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] opacity-60 font-medium truncate">
                  {isThai ? "ผู้ดูแลระบบสูงสุด" : "System Admins"}
                </div>
                <div
                  className={`text-base font-bold leading-tight mt-0.5 ${
                    isLight ? "text-zinc-900" : "text-white"
                  }`}
                >
                  {activeSystemAdmins.length} {isThai ? "คน" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            {/* Left: Search input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isThai
                    ? "ค้นหาด้วยชื่อ, อีเมล, รหัส หรือชื่อบทบาท..."
                    : "Search by name, email, employee ID, or role..."
                }
                className={`w-full pl-9 pr-8 py-2 rounded-lg text-xs outline-none transition-colors ${
                  isLight
                    ? "bg-zinc-100 border border-zinc-200 focus:border-zinc-800 text-zinc-900"
                    : "bg-[#2C2C2C] border border-[#555555] focus:border-white text-white"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right: Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter 1: Role */}
              <div className="min-w-[160px]">
                <CustomDropdown
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleDropdownOptions}
                  searchable={roles.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาบทบาท..." : "Search role..."}
                />
              </div>

              {/* Filter 2: Department / Facility */}
              {deptFacilityOptions.length > 0 && (
                <div className="min-w-[170px]">
                  <CustomDropdown
                    value={deptFacilityFilter}
                    onChange={setDeptFacilityFilter}
                    options={deptFacilityDropdownOptions}
                    searchable={deptFacilityOptions.length > 5}
                    searchPlaceholder={isThai ? "ค้นหาแผนก/สาขา..." : "Search dept/facility..."}
                  />
                </div>
              )}

              {/* Filter 3: Account Status */}
              <div className="min-w-[130px]">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusDropdownOptions}
                />
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                      : "bg-[#444444] hover:bg-[#555555] text-white"
                  }`}
                  title={isThai ? "ล้างตัวกรองทั้งหมด" : "Clear all filters"}
                >
                  <RotateCcw size={12} />
                  <span>{isThai ? "ล้างตัวกรอง" : "Reset"}</span>
                  <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/15">
                    {activeFiltersCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Users & Roles List Table */}
          <div
            className={`rounded-xl border overflow-hidden transition-colors ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-xs text-left">
                <thead
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isLight ? "bg-[#F4F4F5] text-zinc-600" : "bg-[#333333] text-zinc-300"
                  }`}
                >
                  <tr>
                    <th className="p-3.5 min-w-[230px]">
                      {isThai ? "พนักงาน / ผู้ใช้งาน" : "User / Employee"}
                    </th>
                    <th className="p-3.5 min-w-[140px]">
                      {isThai ? "แผนก / สาขา" : "Department & Facility"}
                    </th>
                    <th className="p-3.5 min-w-[90px]">
                      {isThai ? "สถานะ" : "Status"}
                    </th>
                    <th className="p-3.5 min-w-[320px]">
                      {isThai ? "บทบาทที่ได้รับมอบหมาย (Current Assigned Roles)" : "Assigned Roles"}
                    </th>
                    <th className="p-3.5 text-right min-w-[110px]">
                      {isThai ? "การจัดการ" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444444]/20">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                          <AlertCircle size={28} />
                          <span className="text-xs font-medium">
                            {isThai
                              ? "ไม่พบพนักงานที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง"
                              : "No users matched the search or filter criteria."}
                          </span>
                          {activeFiltersCount > 0 && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-1 px-3 py-1 rounded-lg text-xs font-bold underline cursor-pointer hover:opacity-100"
                            >
                              {isThai ? "ล้างตัวกรองและลองใหม่อีกครั้ง" : "Clear filters and try again"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const userRoles = user.roles || [];
                      const initials = (user.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${
                            isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                          }`}
                        >
                          {/* 1. User Identity */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                  isLight
                                    ? "bg-zinc-200 text-zinc-800"
                                    : "bg-[#2A2A2A] text-white border border-[#555555]"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.username && (
                                    <span className="text-[10px] font-mono opacity-50">
                                      (@{user.username})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono opacity-60 truncate mt-0.5">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Department & Facility */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1">
                              {user.department ? (
                                <span className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                                  <Building size={11} className="opacity-50 shrink-0" />
                                  <span className="truncate">{user.department.name}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] opacity-40 italic">-</span>
                              )}
                              {user.facility && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded w-fit font-mono ${
                                    isLight
                                      ? "bg-zinc-100 text-zinc-700"
                                      : "bg-[#2C2C2C] text-zinc-300"
                                  }`}
                                >
                                  {user.facility.name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Account Status */}
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.accountStatus === "ACTIVE"
                                  ? "bg-[#2EC4B6]/15 text-[#2EC4B6]"
                                  : user.accountStatus === "SUSPENDED"
                                  ? "bg-[#FF9F1C]/15 text-[#FF9F1C]"
                                  : "bg-[#E71D36]/15 text-[#E71D36]"
                              }`}
                            >
                              {user.accountStatus}
                            </span>
                          </td>

                          {/* 4. Assigned Roles */}
                          <td className="p-3.5">
                            {userRoles.length === 0 ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border border-dashed transition-colors ${
                                  isLight
                                    ? "border-zinc-300 bg-zinc-100/70 text-zinc-500"
                                    : "border-[#555555] bg-[#2C2C2C] text-zinc-400"
                                }`}
                              >
                                <AlertCircle size={12} className={isLight ? "text-zinc-400" : "text-zinc-500"} />
                                <span>{isThai ? "ยังไม่มีบทบาทที่มอบหมาย" : "No Role Assigned"}</span>
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {userRoles.map((r) => {
                                  const isSysAdmin = r.code === "SYSTEM_ADMINISTRATOR";
                                  const isExpiring = Boolean(r.validUntil);

                                  return (
                                    <div
                                      key={r.assignmentId || r.roleId}
                                      className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                        isSysAdmin
                                          ? isLight
                                            ? "bg-zinc-200/90 text-zinc-900 border-zinc-300 shadow-2xs font-semibold"
                                            : "bg-white/[0.12] text-white border-white/20 shadow-2xs font-semibold"
                                          : isLight
                                          ? "bg-zinc-100 text-zinc-800 border-zinc-200 hover:border-zinc-300"
                                          : "bg-[#2A2A2A] text-zinc-200 border-[#444444] hover:border-zinc-500"
                                      }`}
                                    >
                                      {isSysAdmin && (
                                        <Shield size={12} className={`${isLight ? "text-zinc-700" : "text-zinc-300"} shrink-0`} />
                                      )}
                                      <span className="font-semibold">{r.name}</span>

                                      {isExpiring && r.validUntil && (
                                        <span
                                          title={`Valid until: ${new Date(r.validUntil).toLocaleDateString()}`}
                                          className="text-[9.5px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 opacity-75 font-mono"
                                        >
                                          {new Date(r.validUntil).toLocaleDateString()}
                                        </span>
                                      )}

                                      {/* Quick Revoke Button */}
                                      <button
                                        type="button"
                                        title={
                                          isThai
                                            ? `เพิกถอนบทบาท ${r.name}`
                                            : `Revoke ${r.name}`
                                        }
                                        onClick={() =>
                                          setRevokeTarget({
                                            user,
                                            roleAssignment: r,
                                          })
                                        }
                                        className="ml-0.5 p-0.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* 5. Actions */}
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => openAssignModalForUser(user)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isLight
                                  ? "bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300 shadow-xs"
                                  : "bg-[#333333] hover:bg-[#3D3D3D] text-white border-[#555555] shadow-xs"
                              }`}
                            >
                              <Plus size={12} />
                              <span>{isThai ? "เพิ่มบทบาท" : "Add Role"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count Info */}
            <div
              className={`p-3 border-t flex items-center justify-between text-xs opacity-70 ${
                isLight ? "border-zinc-200 bg-zinc-50" : "border-[#444444] bg-[#333333]/30"
              }`}
            >
              <span>
                {isThai ? "แสดงพนักงาน: " : "Displaying: "}
                <strong>{filteredUsers.length}</strong> {isThai ? "จากทั้งหมด " : "of "}
                <strong>{totalUsersCount}</strong> {isThai ? "คน" : "users"}
              </span>

              <span className="text-[11px] font-mono">
                {isThai ? "รวมการถือครองบทบาททั้งหมด: " : "Total Active Grants: "}
                <strong>{totalAssignmentsCount}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* Sub-Tab 2: Canonical Roles View                                      */}
      {/* ==================================================================== */}
      {currentSubTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Role List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {roles.map((r) => {
              const isSelected = selectedRole ? selectedRole.id === r.id : false;
              const assignedCount = users.filter((u) => u.roles?.some((ur) => ur.code === r.code)).length;

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
                        <Shield size={12} className={isLight ? "text-zinc-600" : "text-zinc-300"} />
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
                                  : (isThai ? "ไม่ระบุวันหมดอายุ (Indefinite)" : "Indefinite")}
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
                              className="px-2.5 py-1 rounded text-red-500 hover:bg-red-500/10 font-bold transition-colors cursor-pointer"
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

      {/* ==================================================================== */}
      {/* Sub-Tab 3: Permission Matrix View                                    */}
      {/* ==================================================================== */}
      {currentSubTab === "matrix" && (
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

      {/* ==================================================================== */}
      {/* Sub-Tab 4: Assignment History                                        */}
      {/* ==================================================================== */}
      {currentSubTab === "history" && (
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

      {/* ==================================================================== */}
      {/* Modal: Assign Role                                                   */}
      {/* ==================================================================== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[500px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <h4 className="font-bold text-base">
                  {isThai ? "มอบหมายบทบาทให้ผู้ใช้งาน" : "Assign Role to User"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-3.5 text-xs">
              {/* User Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">
                  {isThai ? "เลือกผู้ใช้งาน" : "Select User"}
                </label>
                <CustomDropdown
                  value={assignUserId || users[0]?.id || ""}
                  onChange={(newUid) => {
                    setAssignUserId(newUid);
                    const targetU = users.find((u) => u.id === newUid);
                    const existingRoles = new Set(targetU?.roles?.map((r) => r.roleId || r.code));
                    const avail = roles.find((r) => !existingRoles.has(r.id) && !existingRoles.has(r.code));
                    if (avail) setAssignRoleId(avail.id);
                  }}
                  searchable={users.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาชื่อ หรืออีเมล..." : "Search user..."}
                  options={modalUserOptions}
                />
              </div>

              {/* Show Existing Roles of Selected User */}
              {modalTargetUser && (
                <div
                  className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-75">
                    {isThai ? "บทบาทปัจจุบันของผู้ใช้นี้:" : "Current Assigned Roles for User:"}
                  </span>
                  {modalTargetUser.roles?.length === 0 ? (
                    <span className="text-[11px] opacity-50 italic">
                      {isThai ? "ยังไม่มีบทบาทที่มอบหมาย" : "No roles currently assigned"}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {modalTargetUser.roles.map((r) => (
                        <span
                          key={r.assignmentId || r.roleId}
                          className={`text-[10.5px] px-2 py-0.5 rounded-md font-medium border ${
                            r.code === "SYSTEM_ADMINISTRATOR"
                              ? isLight
                                ? "bg-zinc-200 text-zinc-900 border-zinc-400 font-bold"
                                : "bg-white/15 text-white border-white/30 font-bold"
                              : isLight
                              ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                              : "bg-[#2C2C2C] border-[#555555] text-zinc-200"
                          }`}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">
                  {isThai ? "เลือกบทบาทที่จะมอบหมาย" : "Select Role to Assign"}
                </label>
                <CustomDropdown
                  value={assignRoleId || roles[0]?.id || ""}
                  onChange={(newRoleId) => setAssignRoleId(newRoleId)}
                  searchable={roles.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาบทบาท..." : "Search role..."}
                  options={modalRoleOptions}
                />
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold opacity-80">
                    {isThai ? "วันเริ่มต้น" : "Valid From"}
                  </label>
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
                  <label className="font-semibold opacity-80">
                    {isThai ? "วันสิ้นสุด (ถ้ามี)" : "Valid Until"}
                  </label>
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

              <div className="text-[11px] opacity-60 italic">
                {isThai
                  ? "* เว้นว่างวันสิ้นสุดไว้หากต้องการให้สิทธิ์มีผลต่อเนื่องแบบไม่มีกำหนด"
                  : "* Leave Valid Until blank for indefinite assignment"}
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-500/30 hover:bg-white/5 font-medium cursor-pointer"
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm cursor-pointer ${
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

      {/* ==================================================================== */}
      {/* Modal: Revoke Role                                                   */}
      {/* ==================================================================== */}
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
                <h4 className="font-bold text-base">
                  {isThai ? "เพิกถอนบทบาทสิทธิ์" : "Revoke Role Assignment"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRevokeSubmit} className="flex flex-col gap-3.5 text-xs">
              <div
                className={`p-3 rounded-lg border flex flex-col gap-1 ${
                  isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"
                }`}
              >
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
                <label className="font-semibold opacity-80">
                  {isThai ? "เหตุผลในการเพิกถอน (จำเป็นต้องระบุ)" : "Revocation Reason (Mandatory)"}
                </label>
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
                  className="px-4 py-2 rounded-lg border border-zinc-500/30 hover:bg-white/5 font-medium cursor-pointer"
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm cursor-pointer"
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
