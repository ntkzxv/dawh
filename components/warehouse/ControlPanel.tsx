"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ellipsis, Eye, EyeOff, KeyRound, Loader2, Pencil, RotateCcw, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { createPortal } from "react-dom";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import CustomDropdown, { type DropdownOption } from "@/components/common/CustomDropdown";
import FilterDropdown from "@/components/common/FilterDropdown";
import FilterButton from "@/components/common/FilterButton";
import SearchInput from "@/components/common/SearchInput";
import CommonButton from "@/components/common/Button";
import SidePanel, { SidePanelAlert, SidePanelFieldError, sidePanelFormStyles, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
import {
  warehouseApi,
  type AuditEvent,
  type CatalogItem,
  type Member,
  type MemberProfile,
  type MemberUpdate,
  type Role,
} from "@/lib/api/warehouse";
import {
  MemberProfileFields,
  profileForm,
  type ProfileForm,
} from "./MemberProfileFields";
import {
  button,
  Field,
  input,
  message,
  Notice,
  panel,
  subtleButton,
  useRemote,
} from "./Ui";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { warehouseRoles } from "@/lib/contracts/warehouse";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { useControlPanelNavigation } from "./ControlPanelNavigationContext";
import {
  ALL_AUDIT_CATEGORIES,
  AUDIT_CATEGORIES,
  getAuditActionLabel,
  getAuditCategoryKey,
} from "./auditLog";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import BranchManagement from "./BranchManagement";

const roleName: Record<Role, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  CEO: "CEO",
  MANAGER: "ผู้จัดการ",
  COUNTER_STAFF: "พนักงานเคาน์เตอร์",
  EMPLOYEE: "พนักงาน",
};
const roleNameEn: Record<Role, string> = {
  ADMIN: "Administrator",
  CEO: "CEO",
  MANAGER: "Manager",
  COUNTER_STAFF: "Counter staff",
  EMPLOYEE: "Employee",
};
const blankProfile: MemberProfile = {
  employeeCode: null,
  phone: null,
  address: null,
  startedOn: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
};
const TABLE_PAGE_SIZE = 10;

export default function ControlPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const account = useOptionalWarehouseAccount();
  const {
    tab,
    auditCategory,
    auditCategories,
    setAuditCategories,
  } = useControlPanelNavigation();
  const { isThai } = useAccountMenu();
  const loadMembers = useCallback(async (signal: AbortSignal) => {
    const [members, branches] = await Promise.all([
      warehouseApi.membersSummary(signal),
      warehouseApi.catalog("branches", signal),
    ]);
    return { members, branches };
  }, []);
  const loadAudit = useCallback(
    (signal: AbortSignal) => warehouseApi.audit(signal),
    [],
  );
  const {
    data: memberData,
    loading: membersLoading,
    error: membersError,
    refresh: refreshMembers,
  } = useRemote(loadMembers, { enabled: tab === "members" });
  const {
    data: audit,
    loading: auditLoading,
    error: auditError,
  } = useRemote(loadAudit, { enabled: tab === "audit" });
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [resettingMember, setResettingMember] = useState<Member | null>(null);
  const [openManageMemberId, setOpenManageMemberId] = useState<number | null>(null);
  const [openRolePickerMemberId, setOpenRolePickerMemberId] = useState<number | null>(null);
  const [manageMenuPosition, setManageMenuPosition] = useState({ top: 0, left: 0 });
  const manageMenuRef = useRef<HTMLDivElement>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<Role | "">("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"all" | "active" | "deactivated">("all");
  const [memberPage, setMemberPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [memberFiltersOpen, setMemberFiltersOpen] = useState(false);
  const memberFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openManageMemberId === null) return;
    const closeMenu = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        manageMenuRef.current?.contains(target) ||
        target.closest("[data-user-manage-trigger]") ||
        target.closest('[role="listbox"]')
      ) return;
      setOpenManageMemberId(null);
      setOpenRolePickerMemberId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenManageMemberId(null);
        setOpenRolePickerMemberId(null);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openManageMemberId]);

  useEffect(() => {
    if (!memberFiltersOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[role="listbox"]')) return;
      if (!memberFiltersRef.current?.contains(target)) setMemberFiltersOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMemberFiltersOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [memberFiltersOpen]);

  useEffect(() => {
    if (!audit) return;
    setAuditCategories(
      AUDIT_CATEGORIES.map((category) => ({
        ...category,
        count: audit.filter((event) => category.actions.includes(event.action))
          .length,
      })),
    );
  }, [audit, setAuditCategories]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setFailure(null);
    setNotice(null);
    try {
      await action();
      await refreshMembers();
      setNotice(success);
      return true;
    } catch (cause) {
      setFailure(message(cause));
      return false;
    }
  };

  const me = account?.me;
  const members = memberData?.members ?? [];
  const branches = memberData?.branches ?? [];
  const normalizedMemberSearch = memberSearch.trim().toLocaleLowerCase();
  const visibleMembers = members.filter((member) => {
    const matchesSearch =
      !normalizedMemberSearch ||
      [
        member.name,
        String(member.id),
        roleName[member.role], roleNameEn[member.role],
        member.role,
        branchLabels(member.branchIds, branches, isThai),
        member.deletedAt ? "ปิดบัญชีแล้ว Deactivated" : "ใช้งาน Active",
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedMemberSearch);
    const matchesRole = !memberRoleFilter || member.role === memberRoleFilter;
    const matchesStatus =
      memberStatusFilter === "all" ||
      (memberStatusFilter === "deactivated"
        ? Boolean(member.deletedAt)
        : !member.deletedAt);
    return matchesSearch && matchesRole && matchesStatus;
  });
  const memberTotalPages = Math.ceil(visibleMembers.length / TABLE_PAGE_SIZE);
  const paginatedMembers = visibleMembers.slice(
    (memberPage - 1) * TABLE_PAGE_SIZE,
    memberPage * TABLE_PAGE_SIZE,
  );
  const isAdmin = me?.role === "ADMIN";
  const canViewAudit = me ? ["ADMIN", "CEO"].includes(me.role) : false;
  const memberRoleOptions: DropdownOption<Role | "">[] = [
    { value: "", label: isThai ? "ทุกตำแหน่ง" : "All roles" },
    ...warehouseRoles.map((role) => ({ value: role, label: isThai ? roleName[role] : roleNameEn[role] })),
  ];
  const memberStatusOptions: DropdownOption<"all" | "active" | "deactivated">[] = [
    { value: "all", label: isThai ? "ทุกสถานะ" : "All statuses" },
    { value: "active", label: isThai ? "ใช้งาน" : "Active" },
    { value: "deactivated", label: isThai ? "ปิดบัญชีแล้ว" : "Deactivated" },
  ];
  const activeMemberFilterCount =
    Number(Boolean(memberRoleFilter)) + Number(memberStatusFilter !== "all");
  const selectedAuditCategory = auditCategories.find(
    (category) => getAuditCategoryKey(category) === auditCategory,
  );
  const visibleAudit = (audit ?? []).filter(
    (event) =>
      auditCategory === ALL_AUDIT_CATEGORIES ||
      selectedAuditCategory?.actions.includes(event.action) === true,
  );
  const auditTotalPages = Math.ceil(visibleAudit.length / TABLE_PAGE_SIZE);
  const paginatedAudit = visibleAudit.slice(
    (auditPage - 1) * TABLE_PAGE_SIZE,
    auditPage * TABLE_PAGE_SIZE,
  );

  useEffect(() => {
    setMemberPage(1);
  }, [normalizedMemberSearch, memberRoleFilter, memberStatusFilter]);

  useEffect(() => {
    setMemberPage((current) => Math.min(current, Math.max(1, memberTotalPages)));
  }, [memberTotalPages]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditCategory]);

  useEffect(() => {
    setAuditPage((current) => Math.min(current, Math.max(1, auditTotalPages)));
  }, [auditTotalPages]);

  if (account?.loading)
    return (
      <WarehousePageTemplate
        titleEn="Admin Control Panel"
        titleTh="แผงควบคุมผู้ดูแลระบบ"
        routePath="/controlpanel"
        fullBleed={tab === "members"}
      >
        <main className={`w-full min-w-0 space-y-5 ${tab === "members" ? "p-6 sm:p-10" : ""}`} aria-busy="true" aria-label={isThai ? "กำลังโหลดแผงควบคุม" : "Loading control panel"}>
          <ControlPanelMemberSkeleton isThai={isThai} isAudit={tab === "audit"} />
        </main>
      </WarehousePageTemplate>
    );
  if (!me)
    return (
      <main className={`mx-auto max-w-6xl p-8 ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
        <p>{account?.error || (isThai ? "กรุณาเข้าสู่ระบบ" : "Please sign in")}</p>
        <Link className="underline" href="/auth/login?from=/controlpanel">
          {isThai ? "เข้าสู่ระบบ" : "Sign in"}
        </Link>
      </main>
    );

  const auditColumns: DataTableColumn<AuditEvent>[] = [
    {
      key: "created_at",
      header: isThai ? "วันที่และเวลา" : "Date and time",
      className: "whitespace-nowrap",
      render: (event) =>
        new Date(event.created_at).toLocaleString(isThai ? "th-TH" : "en-GB"),
    },
    {
      key: "event",
      header: isThai ? "เหตุการณ์" : "Event",
      className: "min-w-48 font-medium",
      render: (event) => getAuditActionLabel(event.action, isThai),
    },
    {
      key: "entity_id",
      header: isThai ? "รายการที่เกี่ยวข้อง" : "Related record",
      className: "whitespace-nowrap font-mono text-xs",
      render: (event) =>
        `${event.entity_type}${event.entity_id === null ? "" : ` #${event.entity_id}`}`,
    },
    {
      key: "actor_email",
      header: isThai ? "ผู้ดำเนินการ" : "Actor",
      className: "whitespace-nowrap",
      render: (event) => event.actor_email ?? (isThai ? "ระบบ" : "System"),
    },
    {
      key: "details",
      header: isThai ? "ข้อมูลที่บันทึก" : "Stored data",
      render: (event) => {
        const hasSnapshot = event.before_data !== null || event.after_data !== null;
        if (!hasSnapshot) return isThai ? "ไม่มีรายละเอียด" : "No details";
        return (
          <details className="max-w-[340px]">
            <summary className="cursor-pointer text-[#6366F1]">
              {isThai ? "ดูข้อมูลก่อนและหลัง" : "View before and after"}
            </summary>
            <div className="mt-2 space-y-2">
              {event.before_data && (
                <div>
                  <span className="font-semibold">{isThai ? "ก่อนหน้า" : "Before"}</span>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/5 p-2 text-[11px] dark:bg-black/20">
                    {JSON.stringify(event.before_data, null, 2)}
                  </pre>
                </div>
              )}
              {event.after_data && (
                <div>
                  <span className="font-semibold">{isThai ? "หลังดำเนินการ" : "After"}</span>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/5 p-2 text-[11px] dark:bg-black/20">
                    {JSON.stringify(event.after_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        );
      },
    },
  ];
  const memberColumns: DataTableColumn<Member>[] = [
    {
      key: "name",
      header: isThai ? "ชื่อผู้ใช้" : "User",
      className: "min-w-48",
      render: (member) => (
        <div>
          <div className="font-semibold">{member.name}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            ID #{member.id}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: isThai ? "ตำแหน่ง" : "Role",
      className: "whitespace-nowrap",
      render: (member) => isThai ? roleName[member.role] : roleNameEn[member.role],
    },
    {
      key: "branches",
      header: isThai ? "สาขาที่รับผิดชอบ" : "Assigned branches",
      className: "min-w-48",
      render: (member) => branchLabels(member.branchIds, branches, isThai),
    },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      className: "whitespace-nowrap",
      render: (member) =>
        member.deletedAt ? (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {isThai ? "ปิดบัญชีแล้ว" : "Deactivated"}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            {isThai ? "ใช้งาน" : "Active"}
          </span>
        ),
    },
    {
      key: "actions",
      header: null,
      headerClassName: "w-14",
      align: "right",
      className: "whitespace-nowrap",
      render: (member) => (
        <button
          type="button"
          aria-label={isThai ? `จัดการผู้ใช้ ${member.name}` : `Manage user ${member.name}`}
          aria-haspopup="menu"
          aria-expanded={openManageMemberId === member.id}
          title={isThai ? "จัดการ" : "Manage"}
          data-user-manage-trigger="true"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={(event) => {
            if (openManageMemberId === member.id) {
              setOpenManageMemberId(null);
              setOpenRolePickerMemberId(null);
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            setManageMenuPosition({
              top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 320)),
              left: Math.max(8, rect.right - 256),
            });
            setOpenRolePickerMemberId(null);
            setOpenManageMemberId(member.id);
          }}
        >
          <Ellipsis className="h-5 w-5" aria-hidden="true" />
        </button>
      ),
    },
  ];

  return (
    <WarehousePageTemplate
      titleEn={tab === "members" ? "Users" : tab === "branches" ? "Branches" : "Admin Control Panel"}
      titleTh={tab === "members" ? "ผู้ใช้" : tab === "branches" ? "สาขา" : "แผงควบคุมผู้ดูแลระบบ"}
      routePath="/controlpanel"
      fullBleed={tab === "members" || tab === "branches"}
    >
      {tab === "branches" ? <BranchManagement /> : <main className={`w-full min-w-0 space-y-6 ${tab === "members" ? "p-6 sm:p-10" : ""}`}>
        {notice && <Notice tone="success">{notice}</Notice>}
        {failure && <Notice tone="error">{failure}</Notice>}
        {(tab === "members" ? membersError : auditError) && (
          <Notice tone="error">
            {tab === "members" ? membersError : auditError}
          </Notice>
        )}

        {tab === "members" && (
          <div className="w-full min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                {membersLoading ? <SkeletonBox className="h-9 w-full rounded-md sm:w-72" /> : <SearchInput
                  value={memberSearch}
                  onChange={(value) => { setMemberSearch(value); setMemberPage(1); }}
                  placeholder={
                    isThai
                      ? "ค้นหาชื่อ, ID, ตำแหน่ง หรือสาขา"
                      : "Search name, ID, role, or branch"
                  }
                  aria-label={isThai ? "ค้นหาผู้ใช้" : "Search users"}
                  width="w-full sm:w-72"
                />}
                {membersLoading ? <SkeletonBox className="h-[33px] w-[104px] rounded-md" /> : <div className="relative shrink-0" ref={memberFiltersRef}>
                  <FilterButton
                    controls="users-filter-panel"
                    expanded={memberFiltersOpen}
                    label={isThai ? "ตัวกรอง" : "Filters"}
                    clearLabel={isThai ? "ล้างตัวกรอง" : "Clear filters"}
                    activeFilterCount={activeMemberFilterCount}
                    onClear={() => {
                      setMemberRoleFilter("");
                      setMemberStatusFilter("all");
                      setMemberPage(1);
                      setMemberFiltersOpen(false);
                    }}
                    onClick={() => setMemberFiltersOpen((open) => !open)}
                  />
                  <AnimatePresence initial={false}>
                    {memberFiltersOpen && (
                    <motion.div
                      id="users-filter-panel"
                      role="region"
                      aria-label={isThai ? "ตัวกรองผู้ใช้" : "User filters"}
                      initial={{ opacity: 0, scale: 0.96, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute right-0 top-full z-30 mt-2 w-[min(440px,calc(100vw-2rem))] origin-top-right space-y-4 rounded-2xl border p-4 shadow-2xl sm:p-5 ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 text-sm font-medium">
                          <span>{isThai ? "ตำแหน่ง" : "Role"}</span>
                          <FilterDropdown
                            value={memberRoleFilter}
                            onChange={(value) => { setMemberRoleFilter(value); setMemberPage(1); }}
                            options={memberRoleOptions.filter((opt): opt is { value: Role; label: string } => Boolean(opt.value))}
                            placeholder={isThai ? "ทุกตำแหน่ง" : "All roles"}
                            className="w-full"
                          />
                        </label>
                        <label className="space-y-1.5 text-sm font-medium">
                          <span>{isThai ? "สถานะ" : "Status"}</span>
                          <FilterDropdown
                            value={memberStatusFilter}
                            onChange={(value) => { setMemberStatusFilter(value); setMemberPage(1); }}
                            options={memberStatusOptions}
                            placeholder={isThai ? "ทุกสถานะ" : "All statuses"}
                            className="w-full"
                          />
                          </label>
                        </div>
                        {activeMemberFilterCount > 0 && (
                          <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                            <CommonButton
                              variant="outline"
                              onClick={() => {
                                setMemberRoleFilter("");
                                setMemberStatusFilter("all");
                                setMemberPage(1);
                                setMemberFiltersOpen(false);
                              }}
                            >
                              {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                            </CommonButton>
                          </div>
                        )}
                      </motion.div>
                  )}
                  </AnimatePresence>
                </div>}
              </div>
              {isAdmin && (membersLoading ? <SkeletonBox className="h-[33px] w-32 rounded-md sm:ml-auto" /> :
                <button
                  type="button"
                  className={`inline-flex h-[33px] shrink-0 items-center justify-center gap-1.5 self-start rounded-[6px] px-4 py-2 text-[13px] font-semibold shadow-xs transition-colors sm:self-auto ${isLight ? "bg-[#222222] text-white hover:bg-[#383838]" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`}
                  onClick={() => {
                    setSelectedMember(null);
                    setFailure(null);
                    setIsCreatePanelOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  {isThai ? "เพิ่มผู้ใช้" : "Add user"}
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className={dataTableFrameClassName(isLight)}>
                <DataTable
                  columns={memberColumns}
                  data={paginatedMembers}
                  keyExtractor={(member) => member.id}
                  isLoading={membersLoading}
                  skeletonRowCount={6}
                  minWidth="1040px"
                  className="w-full"
                  emptyTitle={
                    normalizedMemberSearch || memberRoleFilter || memberStatusFilter !== "all"
                      ? isThai
                        ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหาหรือตัวกรอง"
                        : "No users match the search or filters"
                      : isThai
                        ? "ยังไม่มีผู้ใช้ในสาขาที่คุณดูได้"
                        : "No users are available for your branches"
                  }
                />
              </div>
              {membersLoading ? <SkeletonBox className="ml-auto h-9 w-64 rounded-xl" /> : visibleMembers.length > 0 && (
                <Pagination
                  currentPage={memberPage}
                  totalPages={memberTotalPages}
                  totalItems={visibleMembers.length}
                  pageSize={TABLE_PAGE_SIZE}
                  onPageChange={setMemberPage}
                  isThai={isThai}
                  className="px-1"
                />
              )}
            </div>
          </div>
        )}

        {tab === "audit" && canViewAudit && (
          <section className={`${panel} space-y-4`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                {auditLoading ? <SkeletonBox className="h-6 w-40 rounded-md" /> : <h2 className="text-lg font-bold">
                  {isThai ? "บันทึกการตรวจสอบ" : "Audit Log"}
                </h2>}
                {auditLoading ? <SkeletonBox className="mt-2 h-4 w-64 rounded-md" /> : <p className="mt-1 text-sm text-slate-500 dark:text-zinc-300">
                  {isThai
                    ? `แสดง ${visibleAudit.length} จาก ${audit?.length ?? 0} รายการที่บันทึกไว้`
                    : `Showing ${visibleAudit.length} of ${audit?.length ?? 0} recorded events`}
                </p>}
                {auditLoading ? <SkeletonBox className="mt-2 h-3 w-72 rounded-md" /> : <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {isThai
                    ? "ระบบยังไม่ได้บันทึกประวัติการเข้าสู่ระบบหรือออกจากระบบ"
                    : "Login and logout history is not currently recorded."}
                </p>}
              </div>
            </div>
            <div className={dataTableFrameClassName(isLight)}>
              <DataTable
                columns={auditColumns}
                data={paginatedAudit}
                keyExtractor={(event) => event.id}
                isLoading={auditLoading}
                skeletonRowCount={5}
                minWidth="1040px"
                emptyTitle={
                  auditCategory === ALL_AUDIT_CATEGORIES
                    ? isThai
                      ? "ยังไม่มีบันทึกการตรวจสอบ"
                      : "No audit events yet"
                    : isThai
                      ? "ไม่พบบันทึกในหมวดนี้"
                      : "No events in this category"
                }
              />
            </div>
            {auditLoading ? <SkeletonBox className="ml-auto h-9 w-64 rounded-xl" /> : visibleAudit.length > 0 && (
              <Pagination
                currentPage={auditPage}
                totalPages={auditTotalPages}
                totalItems={visibleAudit.length}
                pageSize={TABLE_PAGE_SIZE}
                onPageChange={setAuditPage}
                isThai={isThai}
                className="px-1"
              />
            )}
          </section>
        )}
      </main>}
      {isCreatePanelOpen && isAdmin && (
        <SidePanel
          item={null}
          eyebrow={isThai ? "สร้างข้อมูลใหม่" : "New User"}
          title={isThai ? "เพิ่มผู้ใช้ใหม่" : "Add user"}
          onClose={() => setIsCreatePanelOpen(false)}
        >
          <CreateMember
            branches={branches}
            error={failure}
            isThai={isThai}
            isLight={isLight}
            onCancel={() => setIsCreatePanelOpen(false)}
            onSave={async (body) => {
              const succeeded = await run(
                () => warehouseApi.createMember(body),
                isThai ? "เพิ่มผู้ใช้แล้ว" : "User added",
              );
              if (succeeded) setIsCreatePanelOpen(false);
              return succeeded;
            }}
          />
        </SidePanel>
      )}
      {openManageMemberId !== null && typeof document !== "undefined" && createPortal(
        <div
          ref={manageMenuRef}
          role="menu"
          aria-label={isThai ? "การจัดการผู้ใช้" : "User actions"}
          className="fixed z-[110] max-h-[min(70vh,420px)] w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#383838] dark:shadow-black/30"
          style={manageMenuPosition}
        >
          {(() => {
            const member = members.find((item) => item.id === openManageMemberId);
            if (!member) return null;
            const mayEdit = !member.deletedAt && (isAdmin || member.id === me.id);
            const menuItemClass = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-white/10";
            const iconClass = "flex size-7 shrink-0 items-center justify-center text-slate-500 dark:text-zinc-300";
            return (
              <>
                <div className="mb-1 border-b border-slate-200 px-2.5 pb-2.5 pt-1 dark:border-white/10">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                    {member.role}
                  </p>
                </div>
                {mayEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={() => {
                      setOpenManageMemberId(null);
                      setOpenRolePickerMemberId(null);
                      setSelectedMember(member);
                    }}
                  >
                    <span className={iconClass}><Pencil className="size-4" aria-hidden="true" /></span>
                    <span className="font-medium text-slate-800 dark:text-zinc-100">{isThai ? "แก้ไขผู้ใช้" : "Edit user"}</span>
                  </button>
                )}
                {isAdmin && !member.deletedAt && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      aria-expanded={openRolePickerMemberId === member.id}
                      className={menuItemClass}
                      onClick={() => setOpenRolePickerMemberId((current) => current === member.id ? null : member.id)}
                    >
                      <span className={iconClass}><UserRound className="size-4" aria-hidden="true" /></span>
                      <span className="flex-1 font-medium text-slate-800 dark:text-zinc-100">{isThai ? "เปลี่ยนตำแหน่ง" : "Change role"}</span>
                      <span className="text-xs text-slate-400" aria-hidden="true">{openRolePickerMemberId === member.id ? "−" : "+"}</span>
                    </button>
                    {openRolePickerMemberId === member.id && (
                      <div className="ml-11 mr-1 space-y-2 border-l-2 border-indigo-200 py-2 pl-3 dark:border-indigo-400/40">
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-300">
                          {isThai ? "เลือกตำแหน่งใหม่" : "Choose a new role"}
                        </p>
                        <CustomDropdown
                          value={member.role}
                          onChange={async (role) => {
                            const succeeded = await run(
                              async () => {
                                await warehouseApi.updateMember(member.id, { role });
                                if (member.id === me.id) await account?.refresh();
                              },
                              isThai ? "เปลี่ยนตำแหน่งผู้ใช้แล้ว" : "User role updated",
                            );
                            if (succeeded) setOpenRolePickerMemberId(null);
                          }}
                          options={memberRoleOptions.filter((opt) => opt.value !== "") as DropdownOption<Role>[]}
                          className="w-full"
                          triggerClassName="!min-h-9 !rounded-lg !py-2 !text-sm"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => {
                        setOpenManageMemberId(null);
                        setOpenRolePickerMemberId(null);
                        setResettingMember(member);
                      }}
                    >
                      <span className={iconClass}><KeyRound className="size-4" aria-hidden="true" /></span>
                      <span className="font-medium text-slate-800 dark:text-zinc-100">{isThai ? "รีเซ็ตรหัสผ่าน" : "Reset password"}</span>
                    </button>
                  </>
                )}
                {isAdmin && !member.deletedAt && member.id !== me.id && (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    onClick={() => {
                      setOpenManageMemberId(null);
                      setOpenRolePickerMemberId(null);
                      setDeletingMember(member);
                    }}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center text-rose-600 dark:text-rose-300"><Trash2 className="size-4" aria-hidden="true" /></span>
                    <span className="font-medium">{isThai ? "ลบผู้ใช้" : "Delete user"}</span>
                  </button>
                )}
                {isAdmin && member.deletedAt && (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItemClass}
                    onClick={async () => {
                      setOpenManageMemberId(null);
                      await run(
                        () => warehouseApi.restoreMember(member.id),
                        isThai ? "กู้คืนผู้ใช้แล้ว" : "User restored",
                      );
                    }}
                  >
                    <span className={iconClass}><RotateCcw className="size-4" aria-hidden="true" /></span>
                    <span className="font-medium text-slate-800 dark:text-zinc-100">{isThai ? "กู้คืนผู้ใช้" : "Restore user"}</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>,
        document.body,
      )}
      {selectedMember && (
        <MemberEditDialog
          key={selectedMember.id}
          member={selectedMember}
          branches={branches}
          actorRole={me.role}
          isThai={isThai}
          onClose={() => setSelectedMember(null)}
          onUpdate={async (body) => {
            const succeeded = await run(
              async () => {
                await warehouseApi.updateMember(selectedMember.id, body);
                if (selectedMember.id === me.id) await account?.refresh();
              },
              isThai ? "บันทึกข้อมูลผู้ใช้แล้ว" : "User updated",
            );
            if (succeeded) setSelectedMember(null);
            return succeeded;
          }}
        />
      )}
      {resettingMember && (
        <ResetPasswordDialog
          key={resettingMember.id}
          member={resettingMember}
          isThai={isThai}
          onClose={() => setResettingMember(null)}
          onReset={async (password) => {
            const succeeded = await run(
              () => warehouseApi.resetMemberPassword(resettingMember.id, password),
              isThai ? "รีเซ็ตรหัสผ่านแล้ว" : "Password reset",
            );
            if (succeeded) setResettingMember(null);
            return succeeded;
          }}
        />
      )}
      {deletingMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeletingMember(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="delete-user-title" className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#383838]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-user-title" className="font-bold">{isThai ? "ยืนยันปิดบัญชีผู้ใช้" : "Deactivate user?"}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
                  {isThai ? `ต้องการปิดบัญชี ${deletingMember.name} ใช่หรือไม่` : `Deactivate ${deletingMember.name}?`}
                </p>
              </div>
              <button type="button" aria-label={isThai ? "ปิด" : "Close"} onClick={() => setDeletingMember(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={subtleButton} onClick={() => setDeletingMember(null)}>{isThai ? "ยกเลิก" : "Cancel"}</button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                onClick={async () => {
                  const succeeded = await run(
                    () => warehouseApi.deleteMember(deletingMember.id),
                    isThai ? "ปิดบัญชีผู้ใช้แล้ว" : "User deactivated",
                  );
                  if (succeeded) setDeletingMember(null);
                }}
              >
                {isThai ? "ยืนยันปิดบัญชี" : "Deactivate user"}
              </button>
            </div>
          </section>
        </div>
      )}
    </WarehousePageTemplate>
  );
}
function ControlPanelMemberSkeleton({ isThai, isAudit = false }: { isThai: boolean; isAudit?: boolean }) {
  const { theme } = useTheme();
  return (
    <section className={`${panel} space-y-4`} aria-hidden="true">
      {isAudit ? (
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-40 rounded-md" />
          <SkeletonBox className="h-4 w-64 rounded-md" />
          <SkeletonBox className="h-3 w-72 rounded-md" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap gap-3">
            <SkeletonBox className="h-9 w-full rounded-md sm:w-72" />
            <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
          </div>
          <SkeletonBox className="h-[33px] w-32 rounded-md" />
        </div>
      )}
      <div className={dataTableFrameClassName(theme === "light")}>
      <DataTable
        columns={isAudit ? [
          { key: "date", header: isThai ? "วันที่และเวลา" : "Date and time" },
          { key: "event", header: isThai ? "เหตุการณ์" : "Event" },
          { key: "record", header: isThai ? "รายการที่เกี่ยวข้อง" : "Related record" },
          { key: "actor", header: isThai ? "ผู้ดำเนินการ" : "Actor" },
          { key: "details", header: isThai ? "รายละเอียด" : "Details" },
        ] : [
          { key: "name", header: isThai ? "ชื่อผู้ใช้" : "User" },
          { key: "role", header: isThai ? "ตำแหน่ง" : "Role" },
          { key: "branches", header: isThai ? "สาขาที่รับผิดชอบ" : "Assigned branches" },
          { key: "status", header: isThai ? "สถานะ" : "Status" },
          { key: "actions", header: null, headerClassName: "w-14" },
        ]}
        data={[]}
        keyExtractor={() => "skeleton"}
        isLoading
        skeletonRowCount={6}
        minWidth="1040px"
      />
      </div>
      {!isAudit && <SkeletonBox className="ml-auto h-9 w-64 rounded-xl" />}
    </section>
  );
}

function branchLabels(ids: number[], branches: CatalogItem[], isThai: boolean) {
  return (
    ids
      .map(
        (id) =>
          branches.find((branch) => branch.id === id)?.name ?? `${isThai ? "สาขา" : "Branch"} ${id}`,
      )
      .join(", ") || (isThai ? "ไม่ระบุสาขา" : "No branch assigned")
  );
}

function BranchDropdownPicker({
  branches,
  value,
  onChange,
  isThai,
  invalid = false,
}: {
  branches: CatalogItem[];
  value: number[];
  onChange: (next: number[]) => void;
  isThai: boolean;
  invalid?: boolean;
}) {
  const [selectedBranch, setSelectedBranch] = useState("");
  const options: DropdownOption<string>[] = branches
    .filter((branch) => branch.active !== false && !value.includes(branch.id))
    .map((branch) => ({ value: String(branch.id), label: branch.name }));

  return (
    <div className="space-y-2">
      <Field label={isThai ? "สาขา" : "Branches"}>
        <CustomDropdown
          value={selectedBranch}
          onChange={(next) => {
            if (!next) return;
            const id = Number(next);
            if (Number.isFinite(id) && !value.includes(id)) onChange([...value, id]);
            setSelectedBranch("");
          }}
          options={options}
          placeholder={isThai ? "เลือก" : "Select"}
          searchable
          className="w-full"
          triggerClassName={`${input} ${invalid ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={invalid}
        />
      </Field>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const branch = branches.find((item) => item.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-zinc-200">
                {branch?.name ?? `${isThai ? "สาขา" : "Branch"} ${id}`}
                <button
                  type="button"
                  aria-label={isThai ? `นำออก ${branch?.name ?? id}` : `Remove ${branch?.name ?? id}`}
                  onClick={() => onChange(value.filter((branchId) => branchId !== id))}
                  className="rounded-full p-0.5 text-slate-500 hover:bg-black/10 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      </div>
  );
}

function MemberEditDialog({
  member,
  branches,
  actorRole,
  isThai,
  onClose,
  onUpdate,
}: {
  member: Member;
  branches: CatalogItem[];
  actorRole: Role;
  isThai: boolean;
  onClose: () => void;
  onUpdate: (body: MemberUpdate) => Promise<boolean>;
}) {
  const isAdmin = actorRole === "ADMIN";
  const [detail, setDetail] = useState<Member | null>(
    member.detailLevel === "FULL" ? member : null,
  );
  const [detailBusy, setDetailBusy] = useState(member.detailLevel !== "FULL");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.detailLevel === "FULL" ? member.email : "");
  const [role, setRole] = useState(member.role);
  const [branchIds, setBranchIds] = useState(member.branchIds);
  const initialProfile = member.detailLevel === "FULL" ? member.profile : blankProfile;
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(
    profileForm(member.detailLevel === "FULL" ? member.profile : blankProfile),
  );
  const full = detail?.detailLevel === "FULL" ? detail : null;

  useEffect(() => {
    if (full) return;
    let active = true;
    setDetailBusy(true);
    setDetailError(null);
    warehouseApi.member(member.id)
      .then((loaded) => {
        if (!active) return;
        setDetail(loaded);
        setName(loaded.name);
        setEmail(loaded.email);
        setRole(loaded.role);
        setBranchIds(loaded.branchIds);
        setUsername(loaded.profile.username ?? "");
        setProfile(profileForm(loaded.profile));
      })
      .catch((cause) => {
        if (active) setDetailError(message(cause));
      })
      .finally(() => {
        if (active) setDetailBusy(false);
      });
    return () => {
      active = false;
    };
  }, [member.id, full, isThai]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = [
      ...(isAdmin && !username.trim() ? ["username"] : []),
      ...(isAdmin && !email.trim() ? ["email"] : []),
      ...(isAdmin && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? ["emailFormat"] : []),
      ...(isAdmin && role !== "ADMIN" && role !== "CEO" && branchIds.length === 0 ? ["branch"] : []),
    ];
    setFieldErrors(nextErrors);
    if (nextErrors.length) return;
    setConfirmSave(true);
  };

  const confirmUpdate = async () => {
    const personal = {
      phone: profile.phone,
      address: profile.address,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
    };
    const body: MemberUpdate = isAdmin
      ? {
          email,
          role,
          branchIds,
          profile: {
            username: username.trim(),
          },
        }
      : { name, profile: personal };
    setSaving(true);
    try {
      if (await onUpdate(body)) onClose();
    } finally {
      setSaving(false);
      setConfirmSave(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#383838] sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 id="edit-user-title" className="text-lg font-bold">{isThai ? "แก้ไขผู้ใช้" : "Edit user"}</h2>
          <button type="button" aria-label={isThai ? "ปิด" : "Close"} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        {detailBusy && (
          <div className="space-y-5" aria-busy="true" aria-label={isThai ? "กำลังโหลดข้อมูลผู้ใช้" : "Loading user details"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><SkeletonBox className="h-4 w-16 rounded" /><SkeletonBox className="h-10 w-full rounded-xl" /></div>
              <div className="space-y-2"><SkeletonBox className="h-4 w-16 rounded" /><SkeletonBox className="h-10 w-full rounded-xl" /></div>
            </div>
            {isAdmin && <div className="space-y-2"><SkeletonBox className="h-4 w-16 rounded" /><SkeletonBox className="h-10 w-full rounded-xl" /></div>}
            {isAdmin && (
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-36 rounded" />
                <SkeletonBox className="h-10 w-full rounded-xl" />
                <div className="flex gap-2"><SkeletonBox className="h-6 w-24 rounded-full" /><SkeletonBox className="h-6 w-24 rounded-full" /></div>
              </div>
            )}
            {!isAdmin && (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBox className="h-4 w-28 rounded" />
                  <SkeletonBox className="h-10 w-full rounded-xl" />
                </div>
              ))}
              <div className="space-y-2 sm:col-span-2">
                <SkeletonBox className="h-4 w-16 rounded" />
                <SkeletonBox className="h-20 w-full rounded-xl" />
              </div>
              {Array.from({ length: 2 }, (_, index) => (
                <div key={`emergency-${index}`} className="space-y-2">
                  <SkeletonBox className="h-4 w-32 rounded" />
                  <SkeletonBox className="h-10 w-full rounded-xl" />
                </div>
            ))}
            </div>
            )}
            <div className="flex justify-end"><SkeletonBox className="h-10 w-32 rounded-xl" /></div>
          </div>
        )}
        {detailError && <Notice tone="error">{detailError}</Notice>}
        {full && (
          <>
            <form className="space-y-4" noValidate onSubmit={(event) => void save(event)}>
              {isAdmin ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={isThai ? "ชื่อผู้ใช้" : "Username"}>
                    <input className={`${input} ${fieldErrors.includes("username") ? sidePanelInvalidFieldClassName : ""}`} value={username} maxLength={80} required aria-invalid={fieldErrors.includes("username")} autoComplete="username" onChange={(event) => { setUsername(event.target.value); setFieldErrors((errors) => errors.filter((field) => field !== "username")); }} />
                    {fieldErrors.includes("username") && <SidePanelFieldError>{isThai ? "กรุณากรอกชื่อผู้ใช้" : "Enter a username."}</SidePanelFieldError>}
                  </Field>
                  <Field label={isThai ? "อีเมล" : "Email"}>
                    <input className={`${input} ${fieldErrors.includes("email") || fieldErrors.includes("emailFormat") ? sidePanelInvalidFieldClassName : ""}`} type="email" value={email} required aria-invalid={fieldErrors.includes("email") || fieldErrors.includes("emailFormat")} autoComplete="email" onChange={(event) => { setEmail(event.target.value); setFieldErrors((errors) => errors.filter((field) => field !== "email" && field !== "emailFormat")); }} />
                    {(fieldErrors.includes("email") || fieldErrors.includes("emailFormat")) && <SidePanelFieldError>{isThai ? (fieldErrors.includes("emailFormat") ? "รูปแบบอีเมลไม่ถูกต้อง" : "กรุณากรอกอีเมล") : (fieldErrors.includes("emailFormat") ? "Enter a valid email address." : "Enter an email address.")}</SidePanelFieldError>}
                  </Field>
                  </div>
                </>
              ) : (
                <Field label={isThai ? "ชื่อ" : "Name"}>
                  <input className={input} value={name} maxLength={160} required onChange={(event) => setName(event.target.value)} />
                </Field>
              )}
              {isAdmin && (
                <>
                  <Field label={isThai ? "ตำแหน่ง" : "Role"}>
                    <CustomDropdown<Role>
                      value={role}
                      onChange={setRole}
                      options={warehouseRoles.map((item) => ({ value: item, label: isThai ? roleName[item] : roleNameEn[item] }))}
                      placeholder={isThai ? "เลือก" : "Select"}
                      className="w-full"
                      triggerClassName={input}
                    />
                  </Field>
                  <BranchDropdownPicker branches={branches} value={branchIds} onChange={(next) => { setBranchIds(next); setFieldErrors((errors) => errors.filter((field) => field !== "branch")); }} isThai={isThai} invalid={fieldErrors.includes("branch")} />
                  {fieldErrors.includes("branch") && <SidePanelFieldError>{isThai ? "กรุณาเลือกสาขา" : "Choose a branch."}</SidePanelFieldError>}
                </>
              )}
              {!isAdmin && <MemberProfileFields value={profile} onChange={setProfile} employmentEditable={false} isThai={isThai} />}
              <div className="flex justify-end">
                <button className={button}>{isThai ? "บันทึกข้อมูล" : "Save changes"}</button>
              </div>
            </form>
          </>
        )}
      </section>
      {confirmSave && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setConfirmSave(false);
          }}
        >
          <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-edit-user-title" className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#383838]">
            <div>
              <h2 id="confirm-edit-user-title" className="font-bold">{isThai ? "ยืนยันการแก้ไขผู้ใช้" : "Confirm user changes"}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">{isThai ? "ต้องการบันทึกการเปลี่ยนแปลงนี้หรือไม่" : "Save these changes?"}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={subtleButton} onClick={() => setConfirmSave(false)} disabled={saving}>{isThai ? "ยกเลิก" : "Cancel"}</button>
              <button type="button" className={button} onClick={() => void confirmUpdate()} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {isThai ? "ยืนยัน" : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ResetPasswordDialog({
  member,
  isThai,
  onClose,
  onReset,
}: {
  member: Member;
  isThai: boolean;
  onClose: () => void;
  onReset: (password: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="reset-user-password-title" className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#383838]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 id="reset-user-password-title" className="font-bold">{isThai ? "รีเซ็ตรหัสผ่าน" : "Reset password"}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-300">{member.name}</p>
          </div>
          <button type="button" aria-label={isThai ? "ปิด" : "Close"} onClick={onClose} disabled={submitting} className="rounded-lg p-1.5 text-slate-500 hover:bg-black/5 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            try {
              if (await onReset(password)) setPassword("");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Field label={isThai ? "รหัสผ่านใหม่" : "New password"}>
            <input className={input} type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={subtleButton} onClick={onClose} disabled={submitting}>{isThai ? "ยกเลิก" : "Cancel"}</button>
            <button type="submit" className={button} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {isThai ? "ยืนยันรีเซ็ต" : "Reset password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CreateMember({
  branches,
  error,
  isThai,
  isLight,
  onCancel,
  onSave,
}: {
  branches: CatalogItem[];
  error: string | null;
  isThai: boolean;
  isLight: boolean;
  onCancel: () => void;
  onSave: (body: {
    name: string;
    email: string;
    role: Role;
    branchIds: number[];
    initialPassword: string;
    profile: Partial<MemberProfile>;
  }) => Promise<boolean>;
}) {
  const panelStyles = sidePanelFormStyles(isLight);
  const createMemberInput = panelStyles.input;
  const fieldLabelClass = panelStyles.label;
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role | "">("");
  const [branchId, setBranchId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const activeBranches = branches.filter((branch) => branch.active !== false);
  const branchRequired = role !== "ADMIN" && role !== "CEO";
  const roleOptions: DropdownOption<Role | "">[] = [
    { value: "", label: isThai ? "ตำแหน่ง" : "Choose role" },
    ...warehouseRoles.map((item) => ({
      value: item,
      label: isThai ? roleName[item] : roleNameEn[item],
    })),
  ];
  const branchOptions: DropdownOption<string>[] = [
    {
      value: "",
      label: activeBranches.length
        ? isThai ? "เลือกสาขา" : "Choose branch"
        : isThai ? "ไม่มีสาขาที่ใช้งาน" : "No active branches",
    },
    ...activeBranches.map((branch) => ({
      value: String(branch.id),
      label: branch.name,
    })),
  ];
  const clearFieldError = (...fields: string[]) => {
    setFieldErrors((current) => current.filter((field) => !fields.includes(field)));
  };
  const fieldErrorText = (field: string) => {
    if (!fieldErrors.includes(field)) return null;
    const errors: Record<string, { th: string; en: string }> = {
      username: { th: "กรุณากรอกชื่อผู้ใช้", en: "Enter a username." },
      firstName: { th: "กรุณากรอกชื่อจริง", en: "Enter a first name." },
      lastName: { th: "กรุณากรอกนามสกุล", en: "Enter a last name." },
      email: { th: "กรุณากรอกอีเมล", en: "Enter an email address." },
      emailFormat: { th: "รูปแบบอีเมลไม่ถูกต้อง", en: "Enter a valid email address." },
      role: { th: "กรุณาเลือกตำแหน่ง", en: "Choose a role." },
      branch: { th: "กรุณาเลือกสาขา", en: "Choose a branch." },
      password: { th: "กรุณากรอกรหัสผ่าน", en: "Enter a password." },
      passwordLength: { th: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", en: "Password must be at least 8 characters." },
    };
    const error = errors[field];
    return error ? (
      <SidePanelFieldError>
        {isThai ? error.th : error.en}
      </SidePanelFieldError>
    ) : null;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    const nextErrors: string[] = [];
    if (!username.trim()) nextErrors.push("username");
    if (!firstName.trim()) nextErrors.push("firstName");
    if (!lastName.trim()) nextErrors.push("lastName");
    if (!email.trim()) nextErrors.push("email");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.push("emailFormat");
    if (!role) nextErrors.push("role");
    if (role && branchRequired && !branchId) nextErrors.push("branch");
    if (!password) nextErrors.push("password");
    else if (password.length < 8) nextErrors.push("passwordLength");

    setFieldErrors(nextErrors);
    if (nextErrors.length) {
      return;
    }
    if (
      await onSave({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email,
        role: role as Role,
        branchIds: branchId ? [Number(branchId)] : [],
        initialPassword: password,
        profile: {
          username: username.trim(),
          ...(isThai
            ? { firstNameTh: firstName.trim(), lastNameTh: lastName.trim() }
            : { firstNameEn: firstName.trim(), lastNameEn: lastName.trim() }),
        },
      })
    ) {
      setUsername("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setRole("");
      setBranchId("");
    }
  };
  return (
    <form
      className={panelStyles.form}
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <div className={panelStyles.content}>
        {error && <SidePanelAlert>{error}</SidePanelAlert>}
        <section className={panelStyles.section}>
      <Field label={isThai ? "ชื่อผู้ใช้" : "Username"} className={panelStyles.field} labelClassName={fieldLabelClass}>
        <input
          className={`${createMemberInput} ${fieldErrors.includes("username") ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={fieldErrors.includes("username")}
          type="text"
          autoComplete="username"
          placeholder={isThai ? "ชื่อผู้ใช้" : "Username"}
          value={username}
          required
          maxLength={80}
          onChange={(event) => { setUsername(event.target.value); clearFieldError("username"); }}
        />
        {fieldErrorText("username")}
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label={isThai ? "ชื่อจริง" : "First name"} className={panelStyles.field} labelClassName={fieldLabelClass}>
          <input
            className={`${createMemberInput} ${fieldErrors.includes("firstName") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={fieldErrors.includes("firstName")}
            type="text"
            autoComplete="given-name"
            placeholder={isThai ? "ชื่อจริง" : "First name"}
            value={firstName}
            required
            maxLength={120}
            onChange={(event) => { setFirstName(event.target.value); clearFieldError("firstName"); }}
          />
          {fieldErrorText("firstName")}
        </Field>
        <Field label={isThai ? "นามสกุล" : "Last name"} className={panelStyles.field} labelClassName={fieldLabelClass}>
          <input
            className={`${createMemberInput} ${fieldErrors.includes("lastName") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={fieldErrors.includes("lastName")}
            type="text"
            autoComplete="family-name"
            placeholder={isThai ? "นามสกุล" : "Last name"}
            value={lastName}
            required
            maxLength={120}
            onChange={(event) => { setLastName(event.target.value); clearFieldError("lastName"); }}
          />
          {fieldErrorText("lastName")}
        </Field>
      </div>
      <Field label={isThai ? "อีเมล" : "Email"} className={panelStyles.field} labelClassName={fieldLabelClass}>
        <input
          className={`${createMemberInput} ${fieldErrors.includes("email") || fieldErrors.includes("emailFormat") ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={fieldErrors.includes("email") || fieldErrors.includes("emailFormat")}
          type="email"
          autoComplete="email"
          placeholder="youremail@dawh.co.th"
          value={email}
          required
          onChange={(event) => { setEmail(event.target.value); clearFieldError("email", "emailFormat"); }}
        />
        {fieldErrorText("email")}
        {fieldErrorText("emailFormat")}
      </Field>
        </section>

        <section className={panelStyles.dividedSection}>
      <Field label={isThai ? "ตำแหน่ง" : "Role"} className={panelStyles.field} labelClassName={fieldLabelClass}>
        <CustomDropdown
          value={role}
          aria-invalid={fieldErrors.includes("role")}
          onChange={(nextRole) => {
            setRole(nextRole);
            setFieldErrors((current) => {
              const nextErrors = current.filter((field) => field !== "role" && field !== "branch");
              const nextRoleRequiresBranch = Boolean(nextRole) && nextRole !== "ADMIN" && nextRole !== "CEO";
              if (nextRoleRequiresBranch && !branchId && (hasAttemptedSubmit || current.includes("branch"))) {
                nextErrors.push("branch");
              }
              return nextErrors;
            });
          }}
          options={roleOptions}
          placeholder={isThai ? "ตำแหน่ง" : "Choose role"}
          className="w-full"
          triggerClassName={`${panelStyles.dropdown} ${role ? (isLight ? "" : "!text-white") : "!text-[#A1A1AA]"} ${fieldErrors.includes("role") ? sidePanelInvalidFieldClassName : ""}`}
        />
        {fieldErrorText("role")}
      </Field>
      <Field label={isThai ? "สาขา" : "Branch"} className={panelStyles.field} labelClassName={fieldLabelClass}>
        <CustomDropdown
          value={branchId}
          aria-invalid={fieldErrors.includes("branch")}
          onChange={(nextBranchId) => {
            setBranchId(nextBranchId);
            clearFieldError("branch");
          }}
          options={branchOptions}
          placeholder={isThai ? "เลือกสาขา" : "Choose branch"}
          disabled={!activeBranches.length}
          className="w-full"
          triggerClassName={`${panelStyles.dropdown} ${branchId ? (isLight ? "" : "!text-white") : "!text-[#A1A1AA]"} ${fieldErrors.includes("branch") ? sidePanelInvalidFieldClassName : ""}`}
        />
        {fieldErrorText("branch")}
      </Field>
      {!activeBranches.length && (
        <p className="text-xs text-slate-500 dark:text-[#A1A1AA]">
          {isThai
            ? "ยังไม่มีสาขาให้เลือก ต้องเพิ่มสาขาก่อนสร้างผู้ใช้ที่ต้องระบุสาขา"
            : "No branches are available. Add a branch before creating a user who needs one."}
        </p>
      )}
        </section>

        <section className={panelStyles.dividedSection}>
      <Field label={isThai ? "รหัสผ่าน" : "Password"} className={panelStyles.field} labelClassName={fieldLabelClass}>
        <div className="relative">
          <input
            className={`${createMemberInput} pr-11 ${fieldErrors.includes("password") || fieldErrors.includes("passwordLength") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={fieldErrors.includes("password") || fieldErrors.includes("passwordLength")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={isThai ? "รหัสผ่าน" : "Password"}
            minLength={8}
            value={password}
            required
            onChange={(event) => { setPassword(event.target.value); clearFieldError("password", "passwordLength"); }}
          />
          <button
            type="button"
            aria-label={showPassword ? (isThai ? "ซ่อนรหัสผ่าน" : "Hide password") : (isThai ? "แสดงรหัสผ่าน" : "Show password")}
            title={showPassword ? (isThai ? "ซ่อนรหัสผ่าน" : "Hide password") : (isThai ? "แสดงรหัสผ่าน" : "Show password")}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {fieldErrorText("password")}
        {fieldErrorText("passwordLength")}
      </Field>
        </section>
      </div>
      <div className={panelStyles.footer}>
        <button
          type="button"
          onClick={onCancel}
          className={panelStyles.cancel}
        >
          {isThai ? "ยกเลิก" : "Cancel"}
        </button>
        <button
          type="submit"
          className={panelStyles.submit}
        >
          {isThai ? "เพิ่มผู้ใช้" : "Add user"}
        </button>
      </div>
    </form>
  );
}
