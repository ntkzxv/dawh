"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
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
  CANONICAL_ROLES,
  INITIAL_USERS,
  INITIAL_ROLE_HISTORY,
  INITIAL_FACILITIES,
  INITIAL_LOCATIONS,
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_UOMS,
  INITIAL_REASON_CODES,
  INITIAL_PRODUCTS,
  INITIAL_SAFETY_STOCK_RULES,
  INITIAL_STOCK_BALANCES,
  INITIAL_STOCK_LEDGER,
} from "./mockData";
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
  Layers,
} from "lucide-react";
import type { FacilityScopeType } from "@/lib/access/types";

export default function AdminControlPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const currentLang = useAppLanguage();
  const isThai = currentLang === "TH";

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<AdminTabKey>("users");

  // Enterprise Domain States
  const [users, setUsers] = useState<AdminUserRecord[]>(INITIAL_USERS);
  const [roles] = useState<CanonicalRole[]>(CANONICAL_ROLES);
  const [roleHistory, setRoleHistory] = useState<RoleAssignmentHistory[]>(INITIAL_ROLE_HISTORY);
  const [facilities, setFacilities] = useState<FacilityRecord[]>(INITIAL_FACILITIES);
  const [locations, setLocations] = useState<WarehouseLocationRecord[]>(INITIAL_LOCATIONS);
  const [departments, setDepartments] = useState<DepartmentRecord[]>(INITIAL_DEPARTMENTS);
  const [categories, setCategories] = useState<ProductCategoryRecord[]>(INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<BrandRecord[]>(INITIAL_BRANDS);
  const [uoms] = useState<UnitOfMeasureRecord[]>(INITIAL_UOMS);
  const [reasonCodes, setReasonCodes] = useState<ReasonCodeRecord[]>(INITIAL_REASON_CODES);
  const [products, setProducts] = useState<ProductRecord[]>(INITIAL_PRODUCTS);
  const [safetyRules, setSafetyRules] = useState<SafetyStockRuleRecord[]>(INITIAL_SAFETY_STOCK_RULES);
  const [balances] = useState<StockBalanceRecord[]>(INITIAL_STOCK_BALANCES);
  const [ledger] = useState<StockLedgerRecord[]>(INITIAL_STOCK_LEDGER);

  // 1. User Management Handlers
  const handleUpdateUserStatus = (
    userId: string,
    status: AdminUserRecord["accountStatus"],
    reason: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, accountStatus: status, statusReason: reason } : u))
    );
  };

  // 2. Role Management Handlers
  const handleAssignRole = (
    userId: string,
    roleId: string,
    validFrom: string | null,
    validUntil: string | null
  ) => {
    const role = roles.find((r) => r.id === roleId);
    const user = users.find((u) => u.id === userId);
    if (!role || !user) return;

    const newAssignmentId = `asg-${Date.now()}`;
    const newRoleItem = {
      assignmentId: newAssignmentId,
      roleId: role.id,
      code: role.code,
      name: role.name,
      validFrom,
      validUntil,
    };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, roles: [...u.roles.filter((r) => r.code !== role.code), newRoleItem] } : u
      )
    );

    const historyItem: RoleAssignmentHistory = {
      id: `hist-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      roleCode: role.code,
      roleName: role.name,
      action: "ASSIGN",
      validFrom,
      validUntil,
      performedBy: "Johnathan Doe (Admin)",
      timestamp: new Date().toISOString(),
    };
    setRoleHistory((prev) => [historyItem, ...prev]);
  };

  const handleRevokeRole = (userId: string, assignmentId: string, reason: string) => {
    const user = users.find((u) => u.id === userId);
    const assignment = user?.roles.find((r) => r.assignmentId === assignmentId);
    if (!user || !assignment) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, roles: u.roles.filter((r) => r.assignmentId !== assignmentId) }
          : u
      )
    );

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
      performedBy: "Johnathan Doe (Admin)",
      timestamp: new Date().toISOString(),
    };
    setRoleHistory((prev) => [historyItem, ...prev]);
  };

  // 3. Facility Scope Handlers
  const handleAssignScope = (
    userId: string,
    facilityId: string,
    facilityCode: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null
  ) => {
    const newScope = {
      id: `sc-${Date.now()}`,
      facilityId,
      facilityCode,
      scopeType,
      validFrom,
      validUntil,
      version: 1,
    };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              facilityScopes: [
                ...u.facilityScopes.filter((s) => s.facilityId !== facilityId),
                newScope,
              ],
            }
          : u
      )
    );
  };

  const handleUpdateScope = (
    userId: string,
    scopeId: string,
    scopeType: FacilityScopeType,
    validFrom: string | null,
    validUntil: string | null,
    version: number
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              facilityScopes: u.facilityScopes.map((s) =>
                s.id === scopeId
                  ? { ...s, scopeType, validFrom, validUntil, version: version + 1 }
                  : s
              ),
            }
          : u
      )
    );
  };

  const handleRevokeScope = (
    userId: string,
    scopeId: string,
    _version: number,
    _reason: string
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, facilityScopes: u.facilityScopes.filter((s) => s.id !== scopeId) }
          : u
      )
    );
  };

  // 4. Organization Handlers
  const handleAddFacility = (data: Partial<FacilityRecord>) => {
    const newFac: FacilityRecord = {
      id: `fac-${Date.now()}`,
      code: data.code || `FAC-${Date.now()}`,
      name: data.name || "New Facility",
      type: data.type || "BRANCH",
      address: data.address || "",
      province: data.province || "",
      latitude: data.latitude || 13.75,
      longitude: data.longitude || 100.5,
      manager: data.manager || "",
      isActive: data.isActive ?? true,
    };
    setFacilities((prev) => [...prev, newFac]);
  };

  const handleUpdateFacility = (id: string, data: Partial<FacilityRecord>) => {
    setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  };

  const handleAddLocation = (data: Partial<WarehouseLocationRecord>) => {
    const newLoc: WarehouseLocationRecord = {
      id: `loc-${Date.now()}`,
      facilityId: data.facilityId || facilities[0]?.id || "",
      facilityCode: data.facilityCode || facilities[0]?.code || "",
      code: data.code || `LOC-${Date.now()}`,
      name: data.name || "New Location",
      type: data.type || "Zone",
      status: data.status || "ACTIVE",
      parentId: data.parentId || null,
      path: data.path || data.code || "",
      depth: data.depth || 1,
    };
    setLocations((prev) => [...prev, newLoc]);
  };

  const handleUpdateLocation = (id: string, data: Partial<WarehouseLocationRecord>) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  };

  const handleAddDepartment = (data: Partial<DepartmentRecord>) => {
    const newDept: DepartmentRecord = {
      id: `dept-${Date.now()}`,
      code: data.code || `DEPT-${Date.now()}`,
      name: data.name || "New Department",
      nameTh: data.nameTh || "แผนกใหม่",
      manager: data.manager || "",
      isActive: data.isActive ?? true,
    };
    setDepartments((prev) => [...prev, newDept]);
  };

  const handleUpdateDepartment = (id: string, data: Partial<DepartmentRecord>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
  };

  // 5. Product Handlers
  const handleAddProduct = (data: Partial<ProductRecord>) => {
    const newProd: ProductRecord = {
      id: `prod-${Date.now()}`,
      sku: data.sku || `SKU-${Date.now()}`,
      nameTh: data.nameTh || "สินค้าใหม่",
      nameEn: data.nameEn || "New Product",
      categoryId: data.categoryId || categories[0]?.id || "",
      categoryName: data.categoryName || categories[0]?.nameEn || "",
      brandId: data.brandId || brands[0]?.id || "",
      brandName: data.brandName || brands[0]?.name || "",
      baseUnit: data.baseUnit || "PCS",
      trackingMethod: data.trackingMethod || "NONE",
      pickingStrategy: data.pickingStrategy || "FIFO",
      weightKg: data.weightKg || 1.0,
      dimensionsCm: data.dimensionsCm || { width: 10, length: 10, height: 10 },
      shelfLifeDays: data.shelfLifeDays || 0,
      storageCondition: data.storageCondition || "Dry Ambient",
      isActive: data.isActive ?? true,
      units: data.units || [],
      barcodes: data.barcodes || [],
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateProduct = (id: string, data: Partial<ProductRecord>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  // 6. Safety Stock Handlers
  const handleAddSafetyRule = (data: Partial<SafetyStockRuleRecord>) => {
    const newRule: SafetyStockRuleRecord = {
      id: `ssr-${Date.now()}`,
      facilityId: data.facilityId || facilities[0]?.id || "",
      facilityCode: data.facilityCode || facilities[0]?.code || "",
      facilityName: data.facilityName || facilities[0]?.name || "",
      productId: data.productId || products[0]?.id || "",
      productSku: data.productSku || products[0]?.sku || "",
      productName: data.productName || products[0]?.nameTh || "",
      minQty: data.minQty || 10,
      maxQty: data.maxQty || 100,
      reorderPoint: data.reorderPoint || 25,
      safetyQty: data.safetyQty || 15,
      currentBalance: data.currentBalance || 30,
    };
    setSafetyRules((prev) => [...prev, newRule]);
  };

  const handleUpdateSafetyRule = (id: string, data: Partial<SafetyStockRuleRecord>) => {
    setSafetyRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

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
      className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#F4F4F5]"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
    >
      {/* Header Navbar with official DAWH brand logo & navigation */}
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo={true}
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
        <MobileNavbar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-y-auto min-h-0 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1240px] flex flex-col items-stretch gap-6">
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
          <div className="w-full">
            {activeTab === "users" && (
              <UserManagementTab
                users={users}
                onUpdateUserStatus={handleUpdateUserStatus}
                currentUserId="usr-001"
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
                onAddCategory={(cat) => setCategories((prev) => [...prev, cat as ProductCategoryRecord])}
                onAddBrand={(br) => setBrands((prev) => [...prev, br as BrandRecord])}
                onAddReasonCode={(rc) => setReasonCodes((prev) => [...prev, rc as ReasonCodeRecord])}
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
        </div>
      </div>
    </div>
  );
}
