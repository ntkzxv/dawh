"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { AdminUserRecord } from "../types";
import {
  Search,
  Filter,
  Users,
  Shield,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  X,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { CustomDropdown, Pagination } from "@/components/common";
import type { ApiPage } from "@/lib/api/client";
import type { ControlPanelListQuery } from "@/lib/api/control-panel";

interface UserManagementTabProps {
  users: AdminUserRecord[];
  onUpdateUserStatus: (userId: string, status: AdminUserRecord["accountStatus"], reason: string) => void;
  page: ApiPage;
  pageIndex: number;
  isPageLoading?: boolean;
  onPageChange: (
    direction: "previous" | "next",
    filters: ControlPanelListQuery,
  ) => void;
  onFiltersChange: (filters: ControlPanelListQuery) => void;
  currentUserId?: string;
  isThai: boolean;
}

export default function UserManagementTab({
  users,
  onUpdateUserStatus,
  page,
  pageIndex,
  isPageLoading,
  onPageChange,
  onFiltersChange,
  currentUserId = "usr-001",
  isThai,
}: UserManagementTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [profileFilter, setProfileFilter] = useState<string>("ALL");
  const lastFilterKey = useRef<string | null>(null);

  // Custom Dropdown Filter State & Ref
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (roleFilter !== "ALL") count++;
    if (facilityFilter !== "ALL") count++;
    if (profileFilter !== "ALL") count++;
    return count;
  }, [statusFilter, roleFilter, facilityFilter, profileFilter]);

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    setFacilityFilter("ALL");
    setProfileFilter("ALL");
  };

  // Distinct facilities for dropdown filter
  const uniqueFacilities = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    users.forEach((u) => {
      if (u.facility) {
        map.set(u.facility.id, u.facility);
      }
    });
    return Array.from(map.values());
  }, [users]);

  // Dropdown options
  const roleFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกบทบาทสิทธิ์" : "All Roles" },
    { value: "SYSTEM_ADMINISTRATOR", label: isThai ? "ผู้ดูแลระบบสูงสุด" : "System Administrator" },
    { value: "WAREHOUSE_MANAGER", label: isThai ? "ผู้จัดการคลังสินค้า" : "Warehouse Manager" },
    { value: "STOCK_CONTROLLER", label: isThai ? "เจ้าหน้าที่ควบคุมสต็อก" : "Stock Controller" },
    { value: "PICKER_PACKER", label: isThai ? "พนักงานหยิบแพ็ค" : "Picker & Packer" },
    { value: "CLAIM_OFFICER", label: isThai ? "เจ้าหน้าที่เคลม" : "Claim Officer" },
  ], [isThai]);

  const facilityFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกสาขา/คลัง" : "All Facilities" },
    ...uniqueFacilities.map((fac) => ({
      value: fac.id,
      label: `${fac.code} - ${fac.name}`,
      badge: fac.code,
    })),
  ], [uniqueFacilities, isThai]);

  const accountStatusOptions = useMemo(() => [
    { value: "ACTIVE", label: isThai ? "ใช้งานปกติ (ACTIVE)" : "ACTIVE" },
    { value: "SUSPENDED", label: isThai ? "ระงับชั่วคราว (SUSPENDED)" : "SUSPENDED" },
    { value: "TERMINATED", label: isThai ? "ยุติการใช้งานถาวร (TERMINATED)" : "TERMINATED" },
  ], [isThai]);

  // Modal States
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserRecord | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<AdminUserRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AdminUserRecord["accountStatus"]>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  // Active System Admins count for guard
  const activeSystemAdminCount = useMemo(() => {
    return users.filter(
      (u) =>
        u.accountStatus === "ACTIVE" &&
        u.roles.some((r) => r.code === "SYSTEM_ADMINISTRATOR")
    ).length;
  }, [users]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.username && user.username.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" || user.accountStatus === statusFilter;

      const matchRole =
        roleFilter === "ALL" ||
        user.roles.some((r) => r.code === roleFilter);

      const matchFacility =
        facilityFilter === "ALL" ||
        user.facility?.id === facilityFilter;

      const matchProfile =
        profileFilter === "ALL" ||
        (profileFilter === "COMPLETE" ? user.profileComplete : !user.profileComplete);

      return matchSearch && matchStatus && matchRole && matchFacility && matchProfile;
    });
  }, [users, searchQuery, statusFilter, roleFilter, facilityFilter, profileFilter]);

  const backendFilters = useMemo<ControlPanelListQuery>(
    () => ({
      search: searchQuery.trim() || null,
      status: statusFilter === "ALL" ? null : statusFilter,
      roleCode: roleFilter === "ALL" ? null : roleFilter,
      facilityId: facilityFilter === "ALL" ? null : facilityFilter,
      profileComplete:
        profileFilter === "ALL" ? null : profileFilter === "COMPLETE",
    }),
    [facilityFilter, profileFilter, roleFilter, searchQuery, statusFilter],
  );

  // Filters are server-side so cursor history is reset with every new query.
  useEffect(() => {
    const key = JSON.stringify(backendFilters);
    if (lastFilterKey.current === null) {
      lastFilterKey.current = key;
      return;
    }
    if (key === lastFilterKey.current) return;
    const timer = window.setTimeout(() => {
      lastFilterKey.current = key;
      onFiltersChange(backendFilters);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [backendFilters, onFiltersChange]);

  const paginatedUsers = filteredUsers;

  // Handle status submit with guards
  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setStatusError(null);

    // Guard 1: Prevent self-disable
    if (statusModalUser.id === currentUserId && newStatus !== "ACTIVE") {
      setStatusError(
        isThai
          ? "ไม่สามารถปิดการใช้งานหรือระงับบัญชีของตนเองได้"
          : "Cannot suspend or terminate your own account."
      );
      return;
    }

    // Guard 2: Protect the last active system admin
    const isSystemAdmin = statusModalUser.roles.some((r) => r.code === "SYSTEM_ADMINISTRATOR");
    if (
      isSystemAdmin &&
      statusModalUser.accountStatus === "ACTIVE" &&
      newStatus !== "ACTIVE" &&
      activeSystemAdminCount <= 1
    ) {
      setStatusError(
        isThai
          ? "ไม่สามารถปิดบัญชีได้ เนื่องจากเป็นผู้ดูแลระบบสูงสุดคนสุดท้ายที่ยังใช้งานอยู่"
          : "Cannot disable the last active System Administrator in the organization."
      );
      return;
    }

    if (!statusReason.trim()) {
      setStatusError(
        isThai ? "กรุณาระบุเหตุผลในการปรับสถานะบัญชี" : "Please provide a reason for the account status change."
      );
      return;
    }

    onUpdateUserStatus(statusModalUser.id, newStatus, statusReason.trim());
    setStatusModalUser(null);
    setStatusReason("");
  };

  const getStatusBadge = (status: AdminUserRecord["accountStatus"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isLight ? "bg-[#2EC4B6]/15 text-[#0F766E]" : "bg-[#2EC4B6]/20 text-[#2EC4B6]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6]" />
            {isThai ? "ใช้งานปกติ" : "ACTIVE"}
          </span>
        );
      case "SUSPENDED":
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isLight ? "bg-[#FF9F1C]/15 text-[#C05621]" : "bg-[#FF9F1C]/20 text-[#FF9F1C]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F1C]" />
            {isThai ? "ระงับชั่วคราว" : "SUSPENDED"}
          </span>
        );
      case "TERMINATED":
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isLight ? "bg-[#E74C3C]/15 text-[#B91C1C]" : "bg-[#E71D36]/20 text-[#E71D36]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E71D36]" />
            {isThai ? "ยุติการใช้งาน" : "TERMINATED"}
          </span>
        );
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
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การจัดการข้อมูลผู้ใช้งานและสถานะบัญชี" : "User Account Management & Status Policies"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "ตรวจสอบตัวตน Better Auth ข้อมูลพนักงาน สิทธิ์การเข้าถึง และควบคุมสถานะความปลอดภัย"
                : "Better Auth identity overview, employee profile, assigned roles & facility scopes"}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isLight ? "bg-zinc-100 text-zinc-700" : "bg-[#2C2C2C] text-[#E4E4E7]"
            }`}
          >
            {users.length} {isThai ? "ผู้ใช้ทั้งหมด" : "Total Users"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isLight ? "text-zinc-400" : "text-zinc-500"
            }`}
          />
          <input
            type="text"
            placeholder={
              isThai ? "ค้นหาด้วยชื่อ, อีเมล หรือชื่อบัญชี..." : "Search by name, email, or username..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none transition-colors border ${
              isLight
                ? "bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-400"
                : "bg-[#2C2C2C] border-[#444444] text-white focus:border-zinc-400"
            }`}
          />
        </div>

        {/* Unified Custom Dropdown Filter */}
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                isLight
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : "bg-red-950/40 text-red-400 border-red-800/50 hover:bg-red-900/50"
              }`}
              title={isThai ? "ล้างตัวกรองทั้งหมด" : "Clear all filters"}
            >
              <RotateCcw size={13} />
              <span>{isThai ? "ล้างตัวกรอง" : "Clear filters"}</span>
            </button>
          )}

          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none ${
                isFilterOpen
                  ? isLight
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-900 border-white shadow-sm"
                  : activeFilterCount > 0
                  ? isLight
                    ? "bg-zinc-100 text-zinc-900 border-zinc-400 font-bold"
                    : "bg-[#444444] text-white border-zinc-400 font-bold"
                  : isLight
                  ? "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  : "bg-[#2C2C2C] border-[#444444] text-zinc-300 hover:bg-[#333333]"
              }`}
            >
              <Filter size={14} className={activeFilterCount > 0 ? "text-[#0D99FF]" : ""} />
              <span>{isThai ? "ตัวกรอง" : "Filter"}</span>
              {activeFilterCount > 0 && (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isFilterOpen
                      ? isLight
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-900 text-white"
                      : "bg-[#0D99FF] text-white"
                  }`}
                >
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </button>

          {/* Dropdown Popup Card */}
          {isFilterOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-[310px] sm:w-[340px] rounded-2xl border p-4 shadow-2xl z-30 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${
                isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
              }`}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#444444]/30">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Filter size={14} />
                  <span>{isThai ? "ตัวกรองข้อมูลผู้ใช้" : "Filter Users"}</span>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#0D99FF]/20 text-[#0D99FF]">
                      {activeFilterCount} {isThai ? "ใช้งานอยู่" : "active"}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 text-[11px] text-red-500 hover:underline font-semibold"
                  >
                    <RotateCcw size={11} />
                    <span>{isThai ? "ล้างตัวกรอง" : "Clear all"}</span>
                  </button>
                )}
              </div>

              {/* 1. Account Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold opacity-70">
                  {isThai ? "สถานะบัญชี" : "Account Status"}
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {(["ALL", "ACTIVE", "SUSPENDED", "TERMINATED"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all ${
                        statusFilter === st
                          ? isLight
                            ? "bg-zinc-900 text-white border-zinc-900 font-bold"
                            : "bg-white text-zinc-900 border-white font-bold"
                          : isLight
                          ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                          : "bg-[#333333] border-[#444444] hover:bg-[#3d3d3d] text-zinc-300"
                      }`}
                    >
                      {st === "ALL"
                        ? isThai
                          ? "ทั้งหมด"
                          : "All"
                        : st === "ACTIVE"
                        ? isThai
                          ? "ใช้งานปกติ"
                          : "Active"
                        : st === "SUSPENDED"
                        ? isThai
                          ? "ระงับชั่วคราว"
                          : "Suspended"
                        : isThai
                        ? "ยุติการใช้งาน"
                        : "Terminated"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Role Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold opacity-70">
                  {isThai ? "บทบาทสิทธิ์" : "Canonical Role"}
                </label>
                <CustomDropdown
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleFilterOptions}
                />
              </div>

              {/* 3. Facility Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold opacity-70">
                  {isThai ? "สังกัดสาขา/คลัง" : "Facility Scope"}
                </label>
                <CustomDropdown
                  value={facilityFilter}
                  onChange={setFacilityFilter}
                  options={facilityFilterOptions}
                  searchable={uniqueFacilities.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                />
              </div>

              {/* 4. Profile Completion */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold opacity-70">
                  {isThai ? "ความสมบูรณ์ของโปรไฟล์พนักงาน" : "Profile Completeness"}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: "ALL", labelTh: "ทั้งหมด", labelEn: "All" },
                    { id: "COMPLETE", labelTh: "ครบถ้วน", labelEn: "Complete" },
                    { id: "INCOMPLETE", labelTh: "ยังไม่ครบ", labelEn: "Incomplete" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProfileFilter(item.id)}
                      className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                        profileFilter === item.id
                          ? isLight
                            ? "bg-zinc-900 text-white border-zinc-900 font-bold"
                            : "bg-white text-zinc-900 border-white font-bold"
                          : isLight
                          ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                          : "bg-[#333333] border-[#444444] hover:bg-[#3d3d3d] text-zinc-300"
                      }`}
                    >
                      {isThai ? item.labelTh : item.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#444444]/30">
                <span className="text-[11px] opacity-60">
                  {filteredUsers.length} {isThai ? "ผู้ใช้ที่ตรงเงื่อนไข" : "matches found"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isLight ? "bg-zinc-900 text-white hover:bg-black" : "bg-white text-zinc-900 hover:bg-zinc-200"
                  }`}
                >
                  {isThai ? "เสร็จสิ้น" : "Apply"}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div
        className={`rounded-xl border overflow-hidden transition-colors shadow-sm ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <div
            className={`flex flex-row items-center px-4 py-2.5 min-w-[880px] text-[12px] font-bold select-none ${
              isLight ? "bg-[#F4F4F5] text-[#444444]" : "bg-[#333333] text-[#E4E4E7]"
            }`}
          >
            <div className="flex-1 min-w-[200px]">{isThai ? "ชื่อผู้ใช้และบัญชี" : "User Identity"}</div>
            <div className="w-[180px] flex-none">{isThai ? "อีเมลยืนยัน" : "Email"}</div>
            <div className="w-[130px] flex-none">{isThai ? "สถานะบัญชี" : "Status"}</div>
            <div className="w-[150px] flex-none">{isThai ? "บทบาทหลัก" : "Role"}</div>
            <div className="w-[160px] flex-none">{isThai ? "สังกัดสาขา/คลัง" : "Facility Scope"}</div>
            <div className="w-[90px] flex-none text-right">{isThai ? "จัดการ" : "Actions"}</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60">
              {isThai ? "ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข" : "No users matched the search criteria."}
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isSysAdmin = user.roles.some((r) => r.code === "SYSTEM_ADMINISTRATOR");

              return (
                <div
                  key={user.id}
                  className={`flex flex-row items-center px-4 py-3 min-w-[880px] border-t text-[12px] transition-colors duration-100 ${
                    isLight
                      ? "border-[#E4E4E7] hover:bg-zinc-50"
                      : "border-[#444444] hover:bg-white/[0.03]"
                  }`}
                >
                  {/* User Identity */}
                  <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                        isLight ? "bg-zinc-200 text-zinc-800" : "bg-[#2C2C2C] text-white"
                      }`}
                    >
                      {user.name.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={isLight ? "text-zinc-900" : "text-white"}>{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-bold">
                            {isThai ? "บัญชีคุณ" : "YOU"}
                          </span>
                        )}
                        {isSysAdmin && (
                          <span title="System Administrator">
                            <Shield size={12} className="text-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] opacity-60">@{user.username || "unassigned"}</div>
                    </div>
                  </div>

                  {/* Email & Verified status */}
                  <div className="w-[180px] flex-none truncate flex items-center gap-1.5">
                    <span className="truncate opacity-80">{user.email}</span>
                    {user.emailVerified ? (
                      <span title="Email Verified">
                        <CheckCircle2 size={13} className="text-[#2EC4B6] shrink-0" />
                      </span>
                    ) : (
                      <span title="Unverified Email">
                        <XCircle size={13} className="text-zinc-400 shrink-0" />
                      </span>
                    )}
                  </div>

                  {/* Account Status Badge */}
                  <div className="w-[130px] flex-none">{getStatusBadge(user.accountStatus)}</div>

                  {/* Roles */}
                  <div className="w-[150px] flex-none truncate">
                    {user.roles.length > 0 ? (
                      <span className="font-medium opacity-90 truncate">
                        {user.roles.map((r) => r.name).join(", ")}
                      </span>
                    ) : (
                      <span className="opacity-40 italic">{isThai ? "ไม่มีบทบาท" : "None"}</span>
                    )}
                  </div>

                  {/* Facility & Department */}
                  <div className="w-[160px] flex-none truncate">
                    <div className="font-medium truncate opacity-90">{user.facility?.code || "GLOBAL"}</div>
                    <div className="text-[11px] opacity-50 truncate">{user.department?.name || "-"}</div>
                  </div>

                  {/* Actions */}
                  <div className="w-[90px] flex-none flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForDetail(user)}
                      title={isThai ? "ดูรายละเอียดผู้ใช้" : "View user details"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                      }`}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusModalUser(user);
                        setNewStatus(user.accountStatus);
                        setStatusReason(user.statusReason || "");
                        setStatusError(null);
                      }}
                      title={isThai ? "เปลี่ยนสถานะบัญชี" : "Change account status"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                      }`}
                    >
                      <Edit size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Pagination (Outside Table Card) */}
        {(filteredUsers.length > 0 || pageIndex > 1) && (
          <div className="mt-4">
            <Pagination
              mode="cursor"
              pageIndex={pageIndex}
              itemCount={filteredUsers.length}
              hasPrevious={pageIndex > 1}
              hasNext={page.hasMore}
              onPrevious={() => onPageChange("previous", backendFilters)}
              onNext={() => onPageChange("next", backendFilters)}
              isLoading={isPageLoading}
              isThai={isThai}
            />
          </div>
        )}

      {/* User Detail Drawer / Modal */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isLight ? "bg-zinc-100 text-zinc-800" : "bg-[#333333] text-white"
                  }`}
                >
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedUserForDetail.name}</h3>
                  <p className="text-xs opacity-60">ID: {selectedUserForDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Identity & Status */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="font-semibold opacity-60 block mb-1">
                  {isThai ? "สถานะการตรวจสอบตัวตน" : "Identity & Security"}
                </span>
                <div className="font-medium flex items-center gap-1.5 mt-0.5">
                  <span>{selectedUserForDetail.email}</span>
                  {selectedUserForDetail.emailVerified ? (
                    <span className="text-[#2EC4B6] font-bold text-[11px]">({isThai ? "ยืนยันแล้ว" : "Verified"})</span>
                  ) : (
                    <span className="text-zinc-400 font-bold text-[11px]">({isThai ? "ยังไม่ยืนยัน" : "Unverified"})</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="opacity-60">{isThai ? "สถานะบัญชี:" : "Status:"}</span>
                  {getStatusBadge(selectedUserForDetail.accountStatus)}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="font-semibold opacity-60 block mb-1">
                  {isThai ? "ข้อมูลประวัติพนักงาน" : "Employee Profile"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="opacity-60">{isThai ? "ความสมบูรณ์:" : "Completeness:"}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedUserForDetail.profileComplete
                        ? isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-900/30 text-emerald-400"
                        : isLight ? "bg-amber-100 text-amber-800" : "bg-amber-900/30 text-amber-400"
                    }`}
                  >
                    {selectedUserForDetail.profileComplete ? (isThai ? "ครบถ้วน" : "Complete") : (isThai ? "ยังไม่ครบ" : "Incomplete")}
                  </span>
                </div>
                <div className="mt-2 text-[11px] opacity-70">
                  {isThai ? "สาขาหลัก:" : "Facility:"} {selectedUserForDetail.facility?.name || "Global HQ"}
                </div>
              </div>
            </div>

            {/* Reason if Suspended or Terminated */}
            {selectedUserForDetail.statusReason && (
              <div className={`p-3 rounded-xl border text-xs ${isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-amber-900/20 border-amber-500/30 text-amber-300"}`}>
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle size={13} />
                  <span>{isThai ? "บันทึกเหตุผลการปรับสถานะ:" : "Status Reason Audit Log:"}</span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">{selectedUserForDetail.statusReason}</p>
              </div>
            )}

            {/* Roles Section */}
            <div className="flex flex-col gap-2 text-xs">
              <h4 className="font-bold flex items-center gap-1.5">
                <Shield size={14} />
                <span>{isThai ? "บทบาทสิทธิ์ที่ได้รับมอบหมาย" : "Assigned Canonical Roles"}</span>
              </h4>
              <div className={`rounded-xl border overflow-hidden ${isLight ? "border-zinc-200" : "border-[#444444]"}`}>
                {selectedUserForDetail.roles.map((r) => (
                  <div key={r.assignmentId} className={`p-2.5 border-b last:border-0 flex justify-between items-center ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/30 border-[#444444]"}`}>
                    <div>
                      <span className="font-bold text-xs">{r.name}</span>
                      <span className="text-[11px] opacity-60 ml-2 font-mono">({r.code})</span>
                    </div>
                    <div className="text-[11px] opacity-60">
                      {r.validUntil ? `Exp: ${new Date(r.validUntil).toLocaleDateString()}` : (isThai ? "ไม่มีวันหมดอายุ" : "No Expiry")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility Scopes Section */}
            <div className="flex flex-col gap-2 text-xs">
              <h4 className="font-bold flex items-center gap-1.5">
                <Building size={14} />
                <span>{isThai ? "ขอบเขตการเข้าถึงระดับสาขาและคลัง" : "Facility Access Scopes"}</span>
              </h4>
              {selectedUserForDetail.facilityScopes.length === 0 ? (
                <div className="p-3 text-center opacity-60 italic border rounded-xl border-dashed">
                  {isThai ? "ไม่มีขอบเขตสาขาเฉพาะ (ใช้สิทธิ์ตามบทบาทหลัก)" : "No specific facility scope assigned."}
                </div>
              ) : (
                <div className={`rounded-xl border overflow-hidden ${isLight ? "border-zinc-200" : "border-[#444444]"}`}>
                  {selectedUserForDetail.facilityScopes.map((scope) => (
                    <div key={scope.id} className={`p-2.5 border-b last:border-0 flex justify-between items-center ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/30 border-[#444444]"}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{scope.facilityCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          scope.scopeType === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {scope.scopeType}
                        </span>
                      </div>
                      <span className="text-[11px] opacity-60 font-mono">v{scope.version}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-[#444444]/40">
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  isLight ? "bg-zinc-100 hover:bg-zinc-200" : "bg-[#333333] hover:bg-[#444444]"
                }`}
              >
                {isThai ? "ปิดหน้าต่าง" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal with Strict Audit Reason & Safety Guards */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div className="flex items-center gap-2">
                <Edit size={18} />
                <h4 className="font-bold text-base">
                  {isThai ? "ปรับเปลี่ยนสถานะบัญชีผู้ใช้" : "Change Account Status"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className={`p-3 rounded-lg border flex flex-col gap-1 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#333333]/40 border-[#444444]"}`}>
                <span className="opacity-60">{isThai ? "ผู้ใช้งานที่กำลังปรับปรุง:" : "Target User:"}</span>
                <span className="font-bold text-sm">{statusModalUser.name}</span>
                <span className="opacity-70 text-[11px]">{statusModalUser.email}</span>
              </div>

              {statusError && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{statusError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">
                  {isThai ? "เลือกสถานะบัญชีใหม่" : "New Account Status"}
                </label>
                <CustomDropdown
                  value={newStatus}
                  onChange={(val) => setNewStatus(val as AdminUserRecord["accountStatus"])}
                  options={accountStatusOptions}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold opacity-80">
                  {isThai ? "เหตุผลในการปรับสถานะ (จำเป็นต้องระบุ)" : "Audit Reason (Mandatory)"}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    isThai
                      ? "ระบุเหตุผล เช่น สิ้นสุดสัญญาจ้าง, ปรับตำแหน่งงาน, ข้อผิดพลาดทางวินัย..."
                      : "Reason for suspension or termination for enterprise audit trail..."
                  }
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none resize-none ${
                    isLight ? "bg-zinc-100 border-zinc-300 focus:border-zinc-800" : "bg-[#333333] border-[#444444] text-white focus:border-zinc-400"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
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
                  {isThai ? "บันทึกสถานะ" : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
