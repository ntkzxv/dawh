"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown, DatePicker, DataTable } from "@/components/common";
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
  Search,
  RotateCcw,
  Filter,
  ChevronDown,
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

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>("ALL");
  const [selectedScopeTypeFilter, setSelectedScopeTypeFilter] = useState<string>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

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

  const scopeFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกระดับสิทธิ์" : "All Scope Levels" },
    { value: "READ", label: isThai ? "READ (อ่านเท่านั้น)" : "READ (Read-only)" },
    { value: "OPERATE", label: isThai ? "OPERATE (ปฏิบัติการ)" : "OPERATE (Operational)" },
    { value: "APPROVE", label: isThai ? "APPROVE (อนุมัติ)" : "APPROVE (Approval)" },
    { value: "ADMIN", label: isThai ? "ADMIN (ผู้ดูแล)" : "ADMIN (Administrator)" },
  ], [isThai]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedUserFilter !== "ALL") count++;
    if (selectedFacilityFilter !== "ALL") count++;
    if (selectedScopeTypeFilter !== "ALL") count++;
    return count;
  }, [searchQuery, selectedUserFilter, selectedFacilityFilter, selectedScopeTypeFilter]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUserFilter("ALL");
    setSelectedFacilityFilter("ALL");
    setSelectedScopeTypeFilter("ALL");
  };

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
    const matchScopeType =
      selectedScopeTypeFilter === "ALL" || scope.scopeType === selectedScopeTypeFilter;

    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      scope.facilityCode.toLowerCase().includes(q) ||
      (facilities.find((f) => f.id === scope.facilityId)?.name || "").toLowerCase().includes(q);

    return matchUser && matchFacility && matchScopeType && matchSearch;
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
      <div className="flex items-center justify-between py-2 px-1">
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
      </div>

      {/* Unified Filter & Action Toolbar */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between transition-colors shadow-sm ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        {/* Left Side: Search + Unified Filter Popover + Clear */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Quick Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] max-w-full sm:max-w-[360px]">
            <Search
              size={15}
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                isLight ? "text-zinc-400" : "text-zinc-400"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isThai ? "ค้นหาชื่อ, อีเมล, รหัสสาขา..." : "Search user, email, facility..."}
              className={`w-full pl-9 pr-8 py-2 rounded-lg text-xs outline-none transition-all ${
                isLight
                  ? "bg-zinc-100/90 border border-zinc-200 focus:border-zinc-800 text-zinc-900 placeholder:text-zinc-400 focus:bg-white"
                  : "bg-[#2C2C2C] border border-[#555555] focus:border-zinc-300 text-white placeholder:text-zinc-400"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity"
                title={isThai ? "ล้างการค้นหา" : "Clear search"}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Unified Filter Button & Dropdown Popover */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none ${
                isFilterOpen
                  ? isLight
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-900 border-white shadow-sm"
                  : activeFiltersCount > 0
                  ? isLight
                    ? "bg-zinc-100 text-zinc-900 border-zinc-400 font-bold"
                    : "bg-[#444444] text-white border-zinc-400 font-bold"
                  : isLight
                  ? "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  : "bg-[#2C2C2C] border-[#444444] text-zinc-300 hover:bg-[#333333]"
              }`}
            >
              <Filter size={14} className={activeFiltersCount > 0 ? "text-[#6366F1]" : ""} />
              <span>{isThai ? "ตัวกรอง" : "Filter"}</span>
              {activeFiltersCount > 0 && (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isFilterOpen
                      ? isLight
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-900 text-white"
                      : "bg-[#6366F1] text-white"
                  }`}
                >
                  {activeFiltersCount}
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
                className={`absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[310px] sm:w-[350px] rounded-2xl border p-4 shadow-2xl z-30 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight
                    ? "bg-white border-zinc-200 text-zinc-900"
                    : "bg-[#282828] border-[#444444] text-white"
                }`}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#444444]/30">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Filter size={14} />
                    <span>{isThai ? "ตัวกรองขอบเขตสาขา" : "Filter Facility Scopes"}</span>
                    {activeFiltersCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#6366F1]/20 text-[#6366F1]">
                        {activeFiltersCount} {isThai ? "ใช้งานอยู่" : "active"}
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 text-[11px] text-red-500 hover:underline font-semibold cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>{isThai ? "ล้างทั้งหมด" : "Clear all"}</span>
                    </button>
                  )}
                </div>

                {/* 1. User Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold opacity-70">
                    {isThai ? "ผู้ใช้งาน" : "User"}
                  </label>
                  <CustomDropdown
                    value={selectedUserFilter}
                    onChange={setSelectedUserFilter}
                    options={userFilterOptions}
                    searchable={users.length > 5}
                    searchPlaceholder={isThai ? "ค้นหาผู้ใช้..." : "Search user..."}
                    size="md"
                  />
                </div>

                {/* 2. Facility Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold opacity-70">
                    {isThai ? "สาขา/คลังสินค้า" : "Facility / Warehouse"}
                  </label>
                  <CustomDropdown
                    value={selectedFacilityFilter}
                    onChange={setSelectedFacilityFilter}
                    options={facilityFilterOptions}
                    searchable={facilities.length > 5}
                    searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                    size="md"
                  />
                </div>

                {/* 3. Scope Level Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold opacity-70">
                    {isThai ? "ระดับสิทธิ์ขอบเขต" : "Scope Level"}
                  </label>
                  <CustomDropdown
                    value={selectedScopeTypeFilter}
                    onChange={setSelectedScopeTypeFilter}
                    options={scopeFilterOptions}
                    size="md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clear Filters Button (When any filter is active) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer select-none ${
                isLight
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm"
                  : "bg-red-950/40 text-red-400 border-red-800/50 hover:bg-red-900/50 shadow-sm"
              }`}
              title={isThai ? "ล้างตัวกรองทั้งหมด" : "Clear all filters"}
            >
              <RotateCcw size={13} />
              <span>{isThai ? "ล้างตัวกรอง" : "Clear Filter"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold leading-none">
                {activeFiltersCount}
              </span>
            </button>
          )}
        </div>

        {/* Right Side: Results Counter & Add Scope Button */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#444444]/20">
          <span className="text-xs opacity-60 font-semibold whitespace-nowrap">
            {filteredScopes.length} {isThai ? "รายการสิทธิ์" : "active scopes"}
          </span>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
              isLight
                ? "bg-[#222222] hover:bg-black text-white active:scale-95"
                : "bg-white hover:bg-zinc-200 text-zinc-900 active:scale-95 font-semibold"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "เพิ่มขอบเขตสาขา" : "Add Scope"}</span>
          </button>
        </div>
      </div>

      {/* Scopes Table */}
      <DataTable<{ user: AdminUserRecord; scope: FacilityScopeTabProps["users"][0]["facilityScopes"][0] }>
        data={filteredScopes}
        keyExtractor={({ scope }) => scope.id}
        minWidth="840px"
        emptyTitle={
          isThai ? "ไม่พบขอบเขตสิทธิ์ที่ตรงกับตัวกรอง" : "No facility scopes found"
        }
        columns={[
          {
            key: "user",
            header: isThai ? "ผู้ใช้งาน" : "User",
            render: ({ user }) => (
              <div className="font-semibold">
                <div>{user.name}</div>
                <div className="font-mono text-[10px] opacity-60">{user.email}</div>
              </div>
            ),
          },
          {
            key: "facility",
            header: isThai ? "สาขา/คลังที่ได้รับมอบหมาย" : "Facility Assigned",
            render: ({ scope }) => {
              const facility = facilities.find((f) => f.id === scope.facilityId);
              return (
                <div>
                  <div className="font-semibold">
                    {facility?.name || scope.facilityCode}
                  </div>
                  <div className="font-mono text-[10px] opacity-60">
                    {scope.facilityCode}
                  </div>
                </div>
              );
            },
          },
          {
            key: "scopeLevel",
            header: isThai ? "ระดับสิทธิ์ขอบเขต" : "Scope Level",
            render: ({ scope }) => getScopeBadge(scope.scopeType),
          },
          {
            key: "version",
            header: isThai ? "เวอร์ชันล็อก" : "Version",
            render: ({ scope }) => (
              <span className="font-mono font-bold opacity-70">v{scope.version}</span>
            ),
          },
          {
            key: "validity",
            header: isThai ? "ระยะเวลาเริ่มต้น/สิ้นสุด" : "Validity Period",
            render: ({ scope }) => (
              <span className="text-[11px] opacity-70">
                {scope.validUntil
                  ? `${
                      scope.validFrom
                        ? new Date(scope.validFrom).toLocaleDateString()
                        : "Now"
                    } - ${new Date(scope.validUntil).toLocaleDateString()}`
                  : isThai
                  ? "ไม่มีกำหนดสิ้นสุด"
                  : "Indefinite"}
              </span>
            ),
          },
          {
            key: "actions",
            header: isThai ? "การดำเนินการ" : "Actions",
            align: "right",
            render: ({ user, scope }) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingScope({ user, scope });
                    setEditScopeType(scope.scopeType);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    isLight
                      ? "hover:bg-zinc-100 text-zinc-700"
                      : "hover:bg-white/10 text-zinc-300"
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
            ),
          },
        ]}
      />

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
