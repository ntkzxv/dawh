"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { useNotification } from "@/context/NotificationContext";
import { HeaderNavbar, MobileNavbar, NavbarMain, NavbarsubControlPanel } from "@/components/navbar";
import { motion } from "framer-motion";
import type {
  AdminTabKey,
  AdminUserRecord,
  CanonicalRole,
  RoleAssignmentHistory,
  FacilityRecord,
  WarehouseLocationRecord,
  DepartmentRecord,
  ProductCategoryRecord,
  BrandRecord,
  UnitOfMeasureRecord,
  ReasonCodeRecord,
  ProductRecord,
  SafetyStockRuleRecord,
  StockBalanceRecord,
  StockLedgerRecord,
} from "./types";
import {
  fetchControlPanelInitialData,
  mapUserSummaryToRecord,
  mapFacilityDtoToRecord,
  mapLocationDtoToRecord,
  mapDepartmentDtoToRecord,
  mapProductDtoToRecord,
  mapSafetyRuleDtoToRecord,
  mapCategoryDtoToRecord,
  mapBrandDtoToRecord,
  mapReasonCodeDtoToRecord,
} from "@/lib/api/control-panel";
import {
  listAdminUsers,
  changeAccountStatus,
  assignRole,
  revokeRole,
  assignFacilityScope,
  updateFacilityScope,
  revokeFacilityScope,
} from "@/lib/api/admin";
import {
  listFacilities,
  createFacility,
  updateFacility,
  listFacilityLocations,
  createFacilityLocation,
  updateLocation,
  listDepartments,
  createDepartment,
  updateDepartment,
  productReferenceApi,
} from "@/lib/api/master-data";
import {
  listProducts,
  createProduct,
  updateProduct,
  listSafetyStockRules,
  createSafetyStockRule,
  updateSafetyStockRule,
} from "@/lib/api/products";
import { listStockBalances, listStockLedger } from "@/lib/api/stock";
import { getAppMe, checkIsAdmin, type AppMe } from "@/lib/api/session";
import type { Facility } from "@/lib/facilities/types";
import type { LocationDto } from "@/lib/locations/types";
import type { DepartmentDto } from "@/lib/departments/types";
import type { Product } from "@/lib/products/types";
import type { SafetyStockRuleDto } from "@/lib/safety-stock/types";
import type { UnitOfMeasureDto } from "@/lib/units-of-measure/types";

import UserManagementTab from "./tabs/UserManagementTab";
import RoleManagementTab from "./tabs/RoleManagementTab";
import FacilityScopeTab from "./tabs/FacilityScopeTab";
import OrganizationTab from "./tabs/OrganizationTab";
import ProductCatalogTab from "./tabs/ProductCatalogTab";
import StockMonitoringTab from "./tabs/StockMonitoringTab";
import SafetyStockTab from "./tabs/SafetyStockTab";

import {
  Users,
  Shield,
  Building2,
  Building,
  Package,
  Activity,
  ShieldAlert,
  RotateCw,
  Database,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { FacilityScopeType } from "@/lib/access/types";

export default function AdminControlPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const currentLang = useAppLanguage();
  const isThai = currentLang === "TH";
  const { notify } = useNotification();

  // Current Logged-in Admin Info
  const [appMe, setAppMe] = useState<AppMe | null>(null);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<AdminTabKey>("users");

  // Sidebar Minimized State (mirrors warehouse layout)
  const [isMinimized, setIsMinimized] = useState(false);
  const [sidebarAnimated, setSidebarAnimated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dawh_sidebar_minimized");
      if (saved !== null) {
        setIsMinimized(JSON.parse(saved));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const handleMinimizedChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    try {
      localStorage.setItem("dawh_sidebar_minimized", JSON.stringify(minimized));
    } catch {
      // Non-blocking
    }
  };

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const router = useRouter();

  // Raw Backend DTO States (needed for versioning in optimistic updates and PATCH requests)
  const [rawFacilities, setRawFacilities] = useState<Facility[]>([]);
  const [rawLocations, setRawLocations] = useState<LocationDto[]>([]);
  const [rawDepartments, setRawDepartments] = useState<DepartmentDto[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [rawUoms, setRawUoms] = useState<UnitOfMeasureDto[]>([]);
  const [rawSafetyRules, setRawSafetyRules] = useState<SafetyStockRuleDto[]>([]);

  // Enterprise Domain States (Empty by default; populated from database only for authorized admins)
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [roles, setRoles] = useState<CanonicalRole[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleAssignmentHistory[]>([]);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([]);
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasureRecord[]>([]);
  const [reasonCodes, setReasonCodes] = useState<ReasonCodeRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [safetyRules, setSafetyRules] = useState<SafetyStockRuleRecord[]>([]);
  const [balances, setBalances] = useState<StockBalanceRecord[]>([]);
  const [ledger, setLedger] = useState<StockLedgerRecord[]>([]);

  // RBAC Permission Check
  const isAdmin = useMemo(() => {
    if (!appMe) return false;
    return checkIsAdmin(appMe.roles, appMe.permissions);
  }, [appMe]);

  // ==========================================================================
  // Initial Data Fetching from PostgreSQL & Next.js APIs
  // ==========================================================================
  const loadAllData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        // Step 1: Verify current session & RBAC privileges
        let meData: AppMe | null = null;
        try {
          const sessionResult = await getAppMe();
          if (sessionResult?.data) {
            meData = sessionResult.data;
            setAppMe(meData);
          }
        } catch {
          setAppMe(null);
        }

        const hasAdminAccess = checkIsAdmin(
          meData?.roles,
          meData?.permissions
        );

        if (!hasAdminAccess) {
          // If user lacks admin permissions: do NOT load enterprise records & do NOT leak mock data
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        // Step 2: User is confirmed Admin -> load live enterprise records
        const payload = await fetchControlPanelInitialData();

        // Store Raw Objects for version tracking
        setRawFacilities(payload.rawFacilities);
        setRawLocations(payload.rawLocations);
        setRawDepartments(payload.rawDepartments);
        setRawProducts(payload.rawProducts);
        setRawUoms(payload.rawUoms);
        setRawSafetyRules(payload.rawSafetyRules);

        // Store Formatted Records (real data from database)
        setUsers(payload.users || []);
        setRoles(payload.roles || []);
        setFacilities(payload.facilities || []);
        setLocations(payload.locations || []);
        setDepartments(payload.departments || []);
        setCategories(payload.categories || []);
        setBrands(payload.brands || []);
        setUoms(payload.uoms || []);
        setReasonCodes(payload.reasonCodes || []);
        setProducts(payload.products || []);
        setSafetyRules(payload.safetyRules || []);
        setBalances(payload.balances || []);
        setLedger(payload.ledger || []);

        // Build Role History from current active role assignments
        const generatedHistory: RoleAssignmentHistory[] = [];
        (payload.users || []).forEach((u) => {
          (u.roles || []).forEach((r) => {
            generatedHistory.push({
              id: `hist-${r.assignmentId}`,
              userId: u.id,
              userName: u.name || u.email,
              roleCode: r.code,
              roleName: r.name,
              action: "ASSIGN",
              validFrom: r.validFrom,
              validUntil: r.validUntil,
              performedBy: "ผู้ดูแลระบบ (System Admin)",
              timestamp: u.createdAt,
            });
          });
        });
        setRoleHistory(generatedHistory);

        const now = new Date();
        const timeStr = now.toLocaleTimeString(isThai ? "th-TH" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastSynced(timeStr);

        if (isManualRefresh) {
          notify.success(
            isThai ? "ซิงค์ข้อมูลสำเร็จ" : "Data Synced",
            {
              message: isThai
                ? "อัปเดตข้อมูลจากฐานข้อมูลล่าสุดเรียบร้อยแล้ว"
                : "All records updated from the database.",
            }
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
        notify.error(isThai ? "ไม่สามารถโหลดข้อมูลได้" : "Data Fetch Failed", {
          message: errorMsg,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isThai, notify]
  );

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Helper to re-fetch specific user list
  const refreshUsers = async () => {
    try {
      const res = await listAdminUsers({ limit: 100 });
      if (res?.data) {
        setUsers(res.data.map(mapUserSummaryToRecord));
      }
    } catch {
      // Non-blocking
    }
  };

  // Helper to re-fetch facilities & locations
  const refreshFacilitiesAndLocations = async () => {
    try {
      const facRes = await listFacilities();
      if (facRes?.data) {
        const facs = facRes.data as Facility[];
        setRawFacilities(facs);
        setFacilities(facs.map(mapFacilityDtoToRecord));

        if (facs.length > 0) {
          const locRes = await Promise.all(
            facs.map((f) =>
              listFacilityLocations(f.id).catch(() => ({ data: [] }))
            )
          );
          const allLocs = locRes.flatMap((r) => (r.data as LocationDto[]) || []);
          setRawLocations(allLocs);
          setLocations(allLocs.map(mapLocationDtoToRecord));
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // Helper to re-fetch departments
  const refreshDepartments = async () => {
    try {
      const deptRes = await listDepartments();
      if (deptRes?.data) {
        const depts = deptRes.data as DepartmentDto[];
        setRawDepartments(depts);
        setDepartments(depts.map(mapDepartmentDtoToRecord));
      }
    } catch {
      // Non-blocking
    }
  };

  // Helper to re-fetch products
  const refreshProducts = async () => {
    try {
      const prodRes = await listProducts();
      if (prodRes?.data) {
        const prods = prodRes.data as Product[];
        setRawProducts(prods);
        setProducts(prods.map(mapProductDtoToRecord));
      }
    } catch {
      // Non-blocking
    }
  };

  // Helper to re-fetch safety rules
  const refreshSafetyRules = async () => {
    try {
      const rulesRes = await listSafetyStockRules();
      if (rulesRes?.data) {
        const rules = rulesRes.data as SafetyStockRuleDto[];
        setRawSafetyRules(rules);
        setSafetyRules(
          rules.map((r) => mapSafetyRuleDtoToRecord(r, r.facilityCode, r.sku))
        );
      }
    } catch {
      // Non-blocking
    }
  };

  // ==========================================================================
  // 1. User Management Handlers (Wired to Backend API)
  // ==========================================================================
  const handleUpdateUserStatus = async (
    userId: string,
    status: AdminUserRecord["accountStatus"],
    reason: string
  ) => {
    try {
      await changeAccountStatus(userId, status, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, accountStatus: status, statusReason: reason } : u
        )
      );
      notify.success(isThai ? "ปรับเปลี่ยนสถานะสำเร็จ" : "Status Updated", {
        message: isThai
          ? `เปลี่ยนสถานะบัญชีผู้ใช้เป็น ${status} เรียบร้อยแล้ว`
          : `Account status updated to ${status}.`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "เปลี่ยนสถานะไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  // ==========================================================================
  // 2. Role Management Handlers (Wired to Backend API)
  // ==========================================================================
  const handleAssignRole = async (
    userId: string,
    roleId: string,
    validFrom: string | null,
    validUntil: string | null
  ) => {
    const role = roles.find((r) => r.id === roleId);
    const user = users.find((u) => u.id === userId);
    if (!role || !user) return;

    try {
      await assignRole(userId, { roleId, validFrom, validUntil });

      notify.success(isThai ? "มอบหมายบทบาทสำเร็จ" : "Role Assigned", {
        message: isThai
          ? `เพิ่มบทบาท ${role.nameTh || role.name} ให้ ${user.name || user.email} แล้ว`
          : `Assigned ${role.name} to ${user.name}.`,
      });

      await refreshUsers();

      // Record in session role history
      const historyItem: RoleAssignmentHistory = {
        id: `hist-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        roleCode: role.code,
        roleName: role.name,
        action: "ASSIGN",
        validFrom,
        validUntil,
        performedBy: appMe?.user?.name || "ผู้ดูแลระบบ",
        timestamp: new Date().toISOString(),
      };
      setRoleHistory((prev) => [historyItem, ...prev]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถมอบหมายบทบาทได้" : "Role Assignment Failed", {
        message: errorMsg,
      });
    }
  };

  const handleRevokeRole = async (
    userId: string,
    assignmentId: string,
    reason: string
  ) => {
    const user = users.find((u) => u.id === userId);
    const assignment = user?.roles.find((r) => r.assignmentId === assignmentId);
    if (!user || !assignment) return;

    try {
      await revokeRole(userId, assignmentId, reason);

      notify.success(isThai ? "เพิกถอนบทบาทสำเร็จ" : "Role Revoked", {
        message: isThai
          ? `เพิกถอนบทบาท ${assignment.name} เรียบร้อยแล้ว`
          : `Revoked role ${assignment.name}.`,
      });

      await refreshUsers();

      const historyItem: RoleAssignmentHistory = {
        id: `hist-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        roleCode: assignment.code,
        roleName: assignment.name,
        action: "REVOKE",
        validFrom: assignment.validFrom,
        validUntil: new Date().toISOString(),
        reason,
        performedBy: appMe?.user?.name || "ผู้ดูแลระบบ",
        timestamp: new Date().toISOString(),
      };
      setRoleHistory((prev) => [historyItem, ...prev]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถเพิกถอนบทบาทได้" : "Role Revocation Failed", {
        message: errorMsg,
      });
    }
  };

  // ==========================================================================
  // 3. Facility Scope Handlers (Wired to Backend API)
  // ==========================================================================
  const handleAssignScope = async (
    userId: string,
    facilityId: string,
    facilityCode: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null
  ) => {
    try {
      await assignFacilityScope(userId, {
        facilityId,
        scopeType,
        validFrom,
        validUntil,
      });

      notify.success(isThai ? "กำหนดขอบเขตสาขาสำเร็จ" : "Scope Assigned", {
        message: isThai
          ? `มอบหมายสิทธิ์ประจำสาขา ${facilityCode} เรียบร้อยแล้ว`
          : `Scope assigned for ${facilityCode}.`,
      });

      await refreshUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถกำหนดสิทธิ์สาขาได้" : "Scope Assignment Failed", {
        message: errorMsg,
      });
    }
  };

  const handleUpdateScope = async (
    userId: string,
    scopeId: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null,
    version: number
  ) => {
    try {
      await updateFacilityScope(userId, scopeId, {
        scopeType,
        validFrom,
        validUntil,
        version,
      });

      notify.success(isThai ? "อัปเดตขอบเขตสาขาสำเร็จ" : "Scope Updated");
      await refreshUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตสิทธิ์สาขาไม่สำเร็จ" : "Scope Update Failed", {
        message: errorMsg,
      });
    }
  };

  const handleRevokeScope = async (
    userId: string,
    scopeId: string,
    version: number,
    reason: string
  ) => {
    try {
      await revokeFacilityScope(userId, scopeId, version, reason);
      notify.success(isThai ? "เพิกถอนขอบเขตสาขาสำเร็จ" : "Scope Revoked");
      await refreshUsers();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "เพิกถอนสิทธิ์สาขาไม่สำเร็จ" : "Scope Revocation Failed", {
        message: errorMsg,
      });
    }
  };

  // ==========================================================================
  // 4. Organization Handlers (Wired to Backend API)
  // ==========================================================================
  const handleAddFacility = async (data: Partial<FacilityRecord>) => {
    try {
      await createFacility({
        code: data.code,
        name: data.name,
        facilityType: data.type || "BRANCH",
        addressLine1: data.address || null,
        province: data.province || null,
        latitude: data.latitude ? String(data.latitude) : null,
        longitude: data.longitude ? String(data.longitude) : null,
        isActive: data.isActive ?? true,
      });

      notify.success(isThai ? "สร้างสาขาสำเร็จ" : "Facility Created", {
        message: isThai
          ? `เพิ่มข้อมูลสาขา ${data.name} เรียบร้อยแล้ว`
          : `Facility ${data.name} created.`,
      });

      await refreshFacilitiesAndLocations();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถสร้างสาขาได้" : "Facility Creation Failed", {
        message: errorMsg,
      });
    }
  };

  const handleUpdateFacility = async (id: string, data: Partial<FacilityRecord>) => {
    const raw = rawFacilities.find((f) => f.id === id);
    if (!raw) return;

    try {
      await updateFacility(id, {
        code: data.code,
        name: data.name,
        facilityType: data.type,
        addressLine1: data.address,
        province: data.province,
        latitude: data.latitude ? String(data.latitude) : null,
        longitude: data.longitude ? String(data.longitude) : null,
        isActive: data.isActive,
        version: raw.version,
      });

      notify.success(isThai ? "บันทึกข้อมูลสาขาสำเร็จ" : "Facility Updated");
      await refreshFacilitiesAndLocations();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตสาขาไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  const handleAddLocation = async (data: Partial<WarehouseLocationRecord>) => {
    const facId = data.facilityId || facilities[0]?.id;
    if (!facId) {
      notify.error(isThai ? "ข้อมูลไม่ครบถ้วน" : "Incomplete", {
        message: isThai ? "กรุณาระบุสาขาสำหรับตำแหน่งคลัง" : "Specify facility.",
      });
      return;
    }

    try {
      await createFacilityLocation(facId, {
        code: data.code,
        name: data.name,
        hierarchyType: (data.type?.toUpperCase() as unknown) || "ZONE",
        locationType: "STORAGE",
        parentId: data.parentId || null,
        status: data.status || "ACTIVE",
        isActive: true,
      });

      notify.success(isThai ? "สร้างตำแหน่งคลังสำเร็จ" : "Location Created", {
        message: isThai
          ? `เพิ่มตำแหน่ง ${data.code} ลงในระบบแล้ว`
          : `Location ${data.code} created.`,
      });

      await refreshFacilitiesAndLocations();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถสร้างตำแหน่งคลังได้" : "Creation Failed", {
        message: errorMsg,
      });
    }
  };

  const handleUpdateLocation = async (id: string, data: Partial<WarehouseLocationRecord>) => {
    const raw = rawLocations.find((l) => l.id === id);
    if (!raw) return;

    try {
      await updateLocation(id, {
        code: data.code,
        name: data.name,
        hierarchyType: (data.type?.toUpperCase() as unknown) || "ZONE",
        status: data.status,
        version: raw.version,
      });

      notify.success(isThai ? "บันทึกตำแหน่งคลังสำเร็จ" : "Location Updated");
      await refreshFacilitiesAndLocations();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตตำแหน่งไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  const handleAddDepartment = async (data: Partial<DepartmentRecord>) => {
    try {
      await createDepartment({
        code: data.code,
        name: data.name || data.nameTh,
        isActive: data.isActive ?? true,
      });

      notify.success(isThai ? "สร้างแผนกสำเร็จ" : "Department Created", {
        message: isThai ? `แผนก ${data.name} ถูกสร้างเรียบร้อยแล้ว` : `Department created.`,
      });

      await refreshDepartments();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถสร้างแผนกได้" : "Creation Failed", { message: errorMsg });
    }
  };

  const handleUpdateDepartment = async (id: string, data: Partial<DepartmentRecord>) => {
    const raw = rawDepartments.find((d) => d.id === id);
    if (!raw) return;

    try {
      await updateDepartment(id, {
        name: data.name || data.nameTh,
        isActive: data.isActive,
        version: raw.version,
      });

      notify.success(isThai ? "บันทึกข้อมูลแผนกสำเร็จ" : "Department Updated");
      await refreshDepartments();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตแผนกไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  // ==========================================================================
  // 5. Product Handlers (Wired to Backend API)
  // ==========================================================================
  const handleAddProduct = async (data: Partial<ProductRecord>) => {
    // Find matching base unit ID
    const baseUnitObj = rawUoms.find((u) => u.code === data.baseUnit) || rawUoms[0];
    if (!baseUnitObj) {
      notify.error(isThai ? "ข้อมูลไม่ครบถ้วน" : "Incomplete", {
        message: isThai ? "ไม่พบข้อมูลหน่วยนับหลักในระบบ" : "Base unit not found.",
      });
      return;
    }

    try {
      await createProduct({
        sku: data.sku,
        nameTh: data.nameTh,
        nameEn: data.nameEn || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        baseUnitId: baseUnitObj.id,
        trackingMethod: data.trackingMethod || "NONE",
        pickingStrategy: data.pickingStrategy || "FIFO",
        weightKg: data.weightKg ? String(data.weightKg) : null,
        widthCm: data.dimensionsCm?.width ? String(data.dimensionsCm.width) : null,
        lengthCm: data.dimensionsCm?.length ? String(data.dimensionsCm.length) : null,
        heightCm: data.dimensionsCm?.height ? String(data.dimensionsCm.height) : null,
        shelfLifeDays: data.shelfLifeDays || null,
        storageCondition: data.storageCondition || null,
        standardCost: null,
        currencyCode: "THB",
        isActive: data.isActive ?? true,
      });

      notify.success(isThai ? "สร้างสินค้าสำเร็จ" : "Product Created", {
        message: isThai
          ? `รหัสสินค้า ${data.sku} บันทึกลงฐานข้อมูลแล้ว`
          : `Product ${data.sku} created.`,
      });

      await refreshProducts();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "ไม่สามารถสร้างสินค้าได้" : "Product Creation Failed", {
        message: errorMsg,
      });
    }
  };

  const handleUpdateProduct = async (id: string, data: Partial<ProductRecord>) => {
    const raw = rawProducts.find((p) => p.id === id);
    if (!raw) return;

    try {
      await updateProduct(id, {
        sku: data.sku,
        nameTh: data.nameTh,
        nameEn: data.nameEn || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        trackingMethod: data.trackingMethod,
        pickingStrategy: data.pickingStrategy,
        weightKg: data.weightKg ? String(data.weightKg) : null,
        shelfLifeDays: data.shelfLifeDays || null,
        storageCondition: data.storageCondition || null,
        isActive: data.isActive,
        version: raw.version,
      });

      notify.success(isThai ? "บันทึกข้อมูลสินค้าสำเร็จ" : "Product Updated");
      await refreshProducts();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตสินค้าไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  const handleAddCategory = async (data: Partial<ProductCategoryRecord>) => {
    try {
      const res = await productReferenceApi.createCategory({
        code: data.code,
        name: data.nameEn || data.nameTh,
        parentId: data.parentId || null,
        description: null,
        isActive: true,
      });
      if (res?.data) {
        setCategories((prev) => [...prev, mapCategoryDtoToRecord(res.data as never)]);
      }
      notify.success(isThai ? "สร้างหมวดหมู่สำเร็จ" : "Category Created");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "สร้างหมวดหมู่ไม่สำเร็จ" : "Failed", { message: errorMsg });
    }
  };

  const handleAddBrand = async (data: Partial<BrandRecord>) => {
    try {
      const res = await productReferenceApi.createBrand({
        code: data.code,
        name: data.name,
        isActive: true,
      });
      if (res?.data) {
        setBrands((prev) => [...prev, mapBrandDtoToRecord(res.data as never)]);
      }
      notify.success(isThai ? "สร้างแบรนด์สำเร็จ" : "Brand Created");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "สร้างแบรนด์ไม่สำเร็จ" : "Failed", { message: errorMsg });
    }
  };

  const handleAddReasonCode = async (data: Partial<ReasonCodeRecord>) => {
    try {
      const res = await productReferenceApi.createReasonCode({
        domain: data.category === "CLAIM" ? "CLAIM" : "ADJUSTMENT",
        code: data.code,
        name: data.nameEn || data.nameTh,
        description: data.description || null,
        requiresNote: false,
        requiresAttachment: false,
        isActive: true,
      });
      if (res?.data) {
        setReasonCodes((prev) => [...prev, mapReasonCodeDtoToRecord(res.data as never)]);
      }
      notify.success(isThai ? "สร้างรหัสเหตุผลสำเร็จ" : "Reason Code Created");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "สร้างรหัสเหตุผลไม่สำเร็จ" : "Failed", { message: errorMsg });
    }
  };

  // ==========================================================================
  // 6. Safety Stock Handlers (Wired to Backend API)
  // ==========================================================================
  const handleAddSafetyRule = async (data: Partial<SafetyStockRuleRecord>) => {
    const facId = data.facilityId || facilities[0]?.id;
    const prodId = data.productId || products[0]?.id;
    if (!facId || !prodId) {
      notify.error(isThai ? "ข้อมูลไม่ครบถ้วน" : "Incomplete", {
        message: isThai ? "กรุณาระบุสาขาและสินค้า" : "Specify facility and product.",
      });
      return;
    }

    try {
      await createSafetyStockRule({
        facilityId: facId,
        productId: prodId,
        minimumQuantity: String(data.minQty || 10),
        maximumQuantity: data.maxQty ? String(data.maxQty) : null,
        reorderPoint: String(data.reorderPoint || 25),
        safetyQuantity: String(data.safetyQty || 15),
      });

      notify.success(isThai ? "สร้างเกณฑ์สต็อกสำเร็จ" : "Safety Rule Created");
      await refreshSafetyRules();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "สร้างเกณฑ์สต็อกไม่สำเร็จ" : "Creation Failed", { message: errorMsg });
    }
  };

  const handleUpdateSafetyRule = async (id: string, data: Partial<SafetyStockRuleRecord>) => {
    const raw = rawSafetyRules.find((r) => r.id === id);
    if (!raw) return;

    try {
      await updateSafetyStockRule(id, {
        minimumQuantity: String(data.minQty || 10),
        maximumQuantity: data.maxQty ? String(data.maxQty) : null,
        reorderPoint: String(data.reorderPoint || 25),
        safetyQuantity: String(data.safetyQty || 15),
        version: raw.version,
      });

      notify.success(isThai ? "บันทึกเกณฑ์สต็อกสำเร็จ" : "Safety Rule Updated");
      await refreshSafetyRules();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      notify.error(isThai ? "อัปเดตเกณฑ์สต็อกไม่สำเร็จ" : "Update Failed", { message: errorMsg });
    }
  };

  // ==========================================================================
  // Navigation Tabs Configuration
  // ==========================================================================
  const navTabs: Array<{ id: AdminTabKey; labelTh: string; labelEn: string; icon: React.ReactNode }> = [
    {
      id: "users",
      labelTh: "การจัดการผู้ใช้",
      labelEn: "User Management",
      icon: <Users size={15} />,
    },
    {
      id: "roles",
      labelTh: "บทบาทและสิทธิ์",
      labelEn: "Role Management",
      icon: <Shield size={15} />,
    },
    {
      id: "scopes",
      labelTh: "ขอบเขตสาขา",
      labelEn: "Facility Scope",
      icon: <Building2 size={15} />,
    },
    {
      id: "organization",
      labelTh: "สาขาและผังคลัง",
      labelEn: "Organization & Facilities",
      icon: <Building size={15} />,
    },
    {
      id: "products",
      labelTh: "ข้อมูลสินค้าและมาสเตอร์",
      labelEn: "Product Master",
      icon: <Package size={15} />,
    },
    {
      id: "stock",
      labelTh: "ติดตามสต็อก",
      labelEn: "Stock Monitoring",
      icon: <Activity size={15} />,
    },
    {
      id: "safety_stock",
      labelTh: "เกณฑ์สต็อกปลอดภัย",
      labelEn: "Safety Stock",
      icon: <ShieldAlert size={15} />,
    },
  ];

  return (
    <div
      className={`flex min-h-screen w-full transition-colors duration-300 ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222] selection:bg-[#222222] selection:text-white"
          : "bg-[#2C2C2C] text-white selection:bg-white/25 selection:text-white"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
    >
      {/* Sidebar with Control Panel Navigation - Slide in from Left to Right */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onAnimationComplete={() => setSidebarAnimated(true)}
        style={{ transform: sidebarAnimated ? "none" : undefined }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="shrink-0 flex h-screen sticky top-0 z-40"
      >
        <NavbarMain
          initialMinimized={isMinimized}
          onMinimizedChange={handleMinimizedChange}
          hubPath="/workspace"
          settingsPath="/settings"
          showAccount={false}
        >
          <NavbarsubControlPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMinimized={isMinimized}
            counts={{
              users: users.length,
              roles: roles.length,
              scopes: users.reduce((acc, u) => acc + (u.facilityScopes?.length || 0), 0),
              organization: facilities.length,
              products: products.length,
              stock: balances.length,
              safety_stock: safetyRules.length,
            }}
          />
        </NavbarMain>
      </motion.div>

      {/* Main Content Viewport - Slide in from Top to Bottom */}
      <motion.div
        initial={{ y: -45, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.55,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto"
      >
        {/* Header Navbar with title, subtitle, and account in topbar (showLogo={false} since brand logo is in sidebar) */}
        <div className="shrink-0 w-full z-30 sticky top-0">
          <HeaderNavbar
            showLogo={false}
            showAccount={true}
            title={isThai ? "แผงควบคุมระบบผู้ดูแล" : "Admin Control Panel"}
            subtitle={
              isThai
                ? "ศูนย์ควบคุมสิทธิ์การเข้าถึง โครงสร้างคลัง สินค้า และการติดตามสต็อก"
                : "Enterprise Identity, RBAC, Facility Topologies, Product Master & Stock Governance"
            }
            lang={currentLang}
            onLangChange={setAppLanguage}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-h-0 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[1240px] flex flex-col items-stretch gap-5">
          {isLoading ? (
            <div
              className={`w-full py-28 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <span className="text-sm font-bold">
                {isThai
                  ? "กำลังโหลดข้อมูลจากฐานข้อมูล..."
                  : "Fetching live enterprise data..."}
              </span>
              <span className={`text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {isThai ? "กำลังซิงค์สิทธิ์และข้อมูลโครงสร้างระบบ" : "Synchronizing RBAC & topologies..."}
              </span>
            </div>
          ) : !isAdmin ? (
            /* Access Denied View: Non-admin users see NO data */
            <div
              className={`w-full py-20 px-6 rounded-2xl border flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-8 shadow-sm transition-colors ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                  isLight ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                }`}
              >
                <ShieldAlert size={36} />
              </div>

              <h2 className="text-xl font-bold mb-2">
                {isThai ? "ไม่มีสิทธิ์เข้าถึงแผงควบคุมระบบ" : "Access Denied: Administrator Only"}
              </h2>

              <p
                className={`text-sm max-w-md leading-relaxed mb-6 ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                {isThai
                  ? "หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (System Administrator) เท่านั้น เนื่องจากบัญชีของคุณไม่มีสิทธิ์ที่จำเป็นในการเข้าถึงหรือดูข้อมูลโครงสร้างระบบ"
                  : "This management console is strictly restricted to system administrators. Your account does not possess the required permissions to view or manage enterprise records."}
              </p>

              {appMe?.user && (
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs mb-6 font-mono ${
                    isLight ? "bg-zinc-50 border-zinc-200 text-zinc-600" : "bg-[#2A2A2A] border-[#444444] text-zinc-400"
                  }`}
                >
                  <span>{appMe.user.email}</span>
                  <span>•</span>
                  <span>{isThai ? "สิทธิ์ปัจจุบัน: บัญชีผู้ใช้ทั่วไป" : "Current Role: Standard User"}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/workspace")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isLight
                      ? "bg-[#222222] hover:bg-[#333333] text-white shadow-sm"
                      : "bg-white hover:bg-zinc-200 text-zinc-900 shadow-sm"
                  }`}
                >
                  {isThai ? "กลับสู่หน้าหลัก" : "Back to Workspace"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/account")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isLight
                      ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                      : "bg-[#2E2E2E] hover:bg-[#3E3E3E] border-[#444444] text-zinc-300"
                  }`}
                >
                  {isThai ? "ดูโปรไฟล์ของฉัน" : "View My Profile"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Live Database Status Bar */}
              <div
                className={`px-4 py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                  isLight
                    ? "bg-white border-[#E4E4E7] shadow-sm"
                    : "bg-[#383838] border-[#444444] shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-950/40 text-emerald-400"
                    }`}
                  >
                    <Database size={16} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold">
                        {isThai ? "เชื่อมต่อฐานข้อมูลระบบแล้ว" : "Live PostgreSQL Connected"}
                      </span>
                    </div>
                    <span className={`text-[11px] ${isLight ? "text-zinc-500" : "text-[#D4D4D8]"}`}>
                      {lastSynced
                        ? isThai
                          ? `ซิงค์ล่าสุดเวลา: ${lastSynced} น.`
                          : `Last synced at: ${lastSynced}`
                        : isThai
                        ? "กำลังเชื่อมต่อ..."
                        : "Connecting..."}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appMe?.user && (
                    <div
                      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                        isLight
                          ? "bg-zinc-50 border-zinc-200 text-zinc-700"
                          : "bg-[#2C2C2C] border-[#444444] text-zinc-300"
                      }`}
                    >
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span className="font-semibold">{appMe.user.name || appMe.user.email}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700 font-bold">
                        {appMe?.roles?.[0] || (isThai ? "ผู้ดูแลระบบ" : "Admin")}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => loadAllData(true)}
                    disabled={isLoading || isRefreshing}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 disabled:opacity-50"
                        : "bg-[#444444] hover:bg-[#505050] text-white disabled:opacity-50"
                    }`}
                  >
                    <RotateCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                    <span>
                      {isRefreshing
                        ? isThai
                          ? "กำลังซิงค์..."
                          : "Syncing..."
                        : isThai
                        ? "รีเฟรชข้อมูล"
                        : "Refresh Data"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Main 7-Domain Segmented Navigation Bar */}
              <div
                className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] transition-colors shadow-sm ${
                  isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
                }`}
              >
                {navTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 select-none ${
                        isActive
                          ? isLight
                            ? "bg-[#222222] text-white shadow"
                            : "bg-white text-zinc-900 shadow"
                          : isLight
                          ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className={isActive ? (isLight ? "text-white" : "text-zinc-900") : "opacity-70"}>
                        {tab.icon}
                      </span>
                      <span>{isThai ? tab.labelTh : tab.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Panel Rendering */}
              <div className="w-full relative min-h-[400px]">
                {activeTab === "users" && (
                  <UserManagementTab
                    users={users}
                    onUpdateUserStatus={handleUpdateUserStatus}
                    currentUserId={appMe?.user?.id || ""}
                    isThai={isThai}
                  />
                )}

                {activeTab === "roles" && (
                  <RoleManagementTab
                    roles={roles}
                    users={users}
                    history={roleHistory}
                    onAssignRole={handleAssignRole}
                    onRevokeRole={handleRevokeRole}
                    isThai={isThai}
                  />
                )}

                {activeTab === "scopes" && (
                  <FacilityScopeTab
                    users={users}
                    facilities={facilities}
                    onAssignScope={handleAssignScope}
                    onUpdateScope={handleUpdateScope}
                    onRevokeScope={handleRevokeScope}
                    isThai={isThai}
                  />
                )}

                {activeTab === "organization" && (
                  <OrganizationTab
                    facilities={facilities}
                    locations={locations}
                    departments={departments}
                    onAddFacility={handleAddFacility}
                    onUpdateFacility={handleUpdateFacility}
                    onAddLocation={handleAddLocation}
                    onUpdateLocation={handleUpdateLocation}
                    onAddDepartment={handleAddDepartment}
                    onUpdateDepartment={handleUpdateDepartment}
                    isThai={isThai}
                  />
                )}

                {activeTab === "products" && (
                  <ProductCatalogTab
                    products={products}
                    categories={categories}
                    brands={brands}
                    uoms={uoms}
                    reasonCodes={reasonCodes}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onAddCategory={handleAddCategory}
                    onAddBrand={handleAddBrand}
                    onAddReasonCode={handleAddReasonCode}
                    isThai={isThai}
                  />
                )}

                {activeTab === "stock" && (
                  <StockMonitoringTab
                    balances={balances}
                    ledger={ledger}
                    facilities={facilities}
                    isThai={isThai}
                  />
                )}

                {activeTab === "safety_stock" && (
                  <SafetyStockTab
                    rules={safetyRules}
                    facilities={facilities}
                    products={products}
                    onAddRule={handleAddSafetyRule}
                    onUpdateRule={handleUpdateSafetyRule}
                    isThai={isThai}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </motion.div>
    </div>
  );
}
