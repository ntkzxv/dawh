"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown } from "@/components/common";
import type { FacilityRecord, WarehouseLocationRecord, DepartmentRecord, LocationType } from "../types";
import {
  Building,
  MapPin,
  Plus,
  Edit,
  FolderTree,
  Boxes,
  Briefcase,
  X,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  GitBranch,
} from "lucide-react";

interface OrganizationTabProps {
  facilities: FacilityRecord[];
  locations: WarehouseLocationRecord[];
  departments: DepartmentRecord[];
  onAddFacility: (data: Partial<FacilityRecord>) => void;
  onUpdateFacility: (id: string, data: Partial<FacilityRecord>) => void;
  onAddLocation: (data: Partial<WarehouseLocationRecord>) => void;
  onUpdateLocation: (id: string, data: Partial<WarehouseLocationRecord>) => void;
  onAddDepartment: (data: Partial<DepartmentRecord>) => void;
  onUpdateDepartment: (id: string, data: Partial<DepartmentRecord>) => void;
  isThai: boolean;
}

export default function OrganizationTab({
  facilities,
  locations,
  departments,
  onAddFacility,
  onUpdateFacility,
  onAddLocation,
  onUpdateLocation,
  onAddDepartment,
  onUpdateDepartment,
  isThai,
}: OrganizationTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeSubTab, setActiveSubTab] = useState<"facilities" | "locations" | "departments">("facilities");
  const [selectedFacilityForLocs, setSelectedFacilityForLocs] = useState<string>("ALL");

  // Facility Modals
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(null);
  const [facilityForm, setFacilityForm] = useState<Partial<FacilityRecord>>({
    code: "",
    name: "",
    type: "BRANCH",
    address: "",
    province: "",
    latitude: 13.7563,
    longitude: 100.5018,
    manager: "",
    isActive: true,
  });

  // Location Modals
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WarehouseLocationRecord | null>(null);
  const [locationForm, setLocationForm] = useState<Partial<WarehouseLocationRecord>>({
    facilityId: facilities[0]?.id || "",
    code: "",
    name: "",
    type: "Zone",
    status: "ACTIVE",
    parentId: null,
  });

  // Department Modals
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentRecord | null>(null);
  const [deptForm, setDeptForm] = useState<Partial<DepartmentRecord>>({
    code: "",
    name: "",
    nameTh: "",
    manager: "",
    isActive: true,
  });

  // Dropdown Options
  const facilityFilterOptions = useMemo(() => [
    { value: "ALL", label: isThai ? "ทุกสาขา/คลัง" : "All Facilities" },
    ...facilities.map((f) => ({
      value: f.id,
      label: `${f.name} (${f.code})`,
      badge: f.code,
    })),
  ], [facilities, isThai]);

  const facilityTypeOptions = useMemo(() => [
    { value: "CENTRAL_WAREHOUSE" as FacilityRecord["type"], label: isThai ? "คลังสินค้าศูนย์กลาง (CENTRAL_WAREHOUSE)" : "CENTRAL_WAREHOUSE" },
    { value: "BRANCH" as FacilityRecord["type"], label: isThai ? "หน่วยสาขา (BRANCH)" : "BRANCH" },
  ], [isThai]);

  const modalFacilityOptions = useMemo(() => [
    ...facilities.map((f) => ({
      value: f.id,
      label: `${f.name} (${f.code})`,
      badge: f.code,
    })),
  ], [facilities]);

  const locationTypeOptions: { value: LocationType; label: string }[] = [
    { value: "Zone", label: "Zone" },
    { value: "Aisle", label: "Aisle" },
    { value: "Rack", label: "Rack" },
    { value: "Shelf", label: "Shelf" },
    { value: "Bin", label: "Bin" },
    { value: "Receiving", label: "Receiving" },
    { value: "Storage", label: "Storage" },
    { value: "Picking", label: "Picking" },
    { value: "Packing", label: "Packing" },
    { value: "Dispatch", label: "Dispatch" },
    { value: "Quarantine", label: "Quarantine" },
    { value: "Damaged", label: "Damaged" },
    { value: "Return", label: "Return" },
  ];

  const parentLocationOptions = useMemo(() => [
    { value: "", label: isThai ? "-- เป็นพิกัดระดับบนสุด (Root Level 1) --" : "-- Root Level --" },
    ...locations
      .filter((l) => l.facilityId === locationForm.facilityId)
      .map((l) => ({
        value: l.id,
        label: `${l.code} - ${l.name}`,
        badge: l.type,
      })),
  ], [locations, locationForm.facilityId, isThai]);

  // Filtered locations
  const filteredLocations = locations.filter(
    (loc) => selectedFacilityForLocs === "ALL" || loc.facilityId === selectedFacilityForLocs
  );

  const handleFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFacility) {
      onUpdateFacility(editingFacility.id, facilityForm);
      setEditingFacility(null);
    } else {
      onAddFacility(facilityForm);
      setIsAddFacilityOpen(false);
    }
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const facility = facilities.find((f) => f.id === locationForm.facilityId);
    if (!facility) return;

    const parentLoc = locations.find((l) => l.id === locationForm.parentId);
    const depth = parentLoc ? parentLoc.depth + 1 : 1;
    const path = parentLoc ? `${parentLoc.path}/${locationForm.code}` : (locationForm.code || "");

    const payload = {
      ...locationForm,
      facilityCode: facility.code,
      depth,
      path,
    };

    if (editingLocation) {
      onUpdateLocation(editingLocation.id, payload);
      setEditingLocation(null);
    } else {
      onAddLocation(payload);
      setIsAddLocationOpen(false);
    }
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      onUpdateDepartment(editingDept.id, deptForm);
      setEditingDept(null);
    } else {
      onAddDepartment(deptForm);
      setIsAddDeptOpen(false);
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
            <Building size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "โครงสร้างองค์กร หน่วยสาขา คลังสินค้า และแผนก" : "Facility, Warehouse Topology & Department Registry"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "บริหารจัดการคลังศูนย์กลาง สาขา จุดจัดเก็บพิกัดลำดับชั้น (Zone/Aisle/Bin) และแผนกงาน"
                : "Central hub distribution networks, multi-depth warehouse topologies & enterprise departments"}
            </p>
          </div>
        </div>

        {/* Dynamic Add Button depending on active sub-tab */}
        {activeSubTab === "facilities" && (
          <button
            type="button"
            onClick={() => {
              setFacilityForm({
                code: `BR-00${facilities.length + 1}`,
                name: "",
                type: "BRANCH",
                address: "",
                province: "",
                latitude: 13.75,
                longitude: 100.50,
                manager: "",
                isActive: true,
              });
              setEditingFacility(null);
              setIsAddFacilityOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isLight ? "bg-[#222222] hover:bg-black text-white" : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "เพิ่มสาขา/คลัง" : "Add Facility"}</span>
          </button>
        )}

        {activeSubTab === "locations" && (
          <button
            type="button"
            onClick={() => {
              setLocationForm({
                facilityId: facilities[0]?.id || "",
                code: "",
                name: "",
                type: "Zone",
                status: "ACTIVE",
                parentId: null,
              });
              setEditingLocation(null);
              setIsAddLocationOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isLight ? "bg-[#222222] hover:bg-black text-white" : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "เพิ่มพื้นที่จัดเก็บ" : "Add Location"}</span>
          </button>
        )}

        {activeSubTab === "departments" && (
          <button
            type="button"
            onClick={() => {
              setDeptForm({
                code: `DEPT-${departments.length + 1}`,
                name: "",
                nameTh: "",
                manager: "",
                isActive: true,
              });
              setEditingDept(null);
              setIsAddDeptOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isLight ? "bg-[#222222] hover:bg-black text-white" : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "เพิ่มแผนก" : "Add Department"}</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b pb-2 border-[#444444]/30">
        <button
          type="button"
          onClick={() => setActiveSubTab("facilities")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "facilities"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <Building size={14} />
          <span>{isThai ? "สาขาและคลังสินค้า" : "Facilities"} ({facilities.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("locations")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "locations"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <FolderTree size={14} />
          <span>{isThai ? "โครงสร้างพื้นที่จัดเก็บ" : "Warehouse Locations"} ({locations.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("departments")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === "departments"
              ? isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              : isLight ? "text-zinc-600 hover:bg-zinc-100" : "text-zinc-400 hover:bg-white/5"
          }`}
        >
          <Briefcase size={14} />
          <span>{isThai ? "แผนกงานภายใน" : "Departments"} ({departments.length})</span>
        </button>
      </div>

      {/* 1. Facilities Sub-tab */}
      {activeSubTab === "facilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between shadow-sm ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        fac.type === "CENTRAL_WAREHOUSE"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {fac.type === "CENTRAL_WAREHOUSE" ? (isThai ? "คลังศูนย์กลาง" : "Central Hub") : (isThai ? "หน่วยสาขา" : "Branch")}
                    </span>
                    <span className="font-mono text-xs opacity-60 font-bold">{fac.code}</span>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => onUpdateFacility(fac.id, { isActive: !fac.isActive })}
                    className="flex items-center gap-1 text-[11px] font-bold"
                  >
                    {fac.isActive ? (
                      <span className="text-[#2EC4B6] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                        {isThai ? "เปิดใช้งาน" : "Active"}
                      </span>
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        {isThai ? "ปิดการใช้งาน" : "Inactive"}
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-base mt-2.5">{fac.name}</h3>

                <div className="flex items-start gap-1.5 mt-2 text-xs opacity-75">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-zinc-400" />
                  <span>{fac.address}</span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
                  <div>
                    <span className="opacity-60">{isThai ? "ผู้จัดการ:" : "Manager:"}</span>{" "}
                    <span className="font-semibold">{fac.manager || "-"}</span>
                  </div>
                  <div>
                    <span className="opacity-60">{isThai ? "พิกัด:" : "Coords:"}</span>{" "}
                    <span className="font-mono">{fac.latitude.toFixed(2)}, {fac.longitude.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#444444]/30">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFacility(fac);
                    setFacilityForm(fac);
                    setIsAddFacilityOpen(true);
                  }}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    isLight ? "hover:bg-zinc-100 text-zinc-800" : "hover:bg-white/10 text-zinc-200"
                  }`}
                >
                  <Edit size={13} />
                  <span>{isThai ? "แก้ไขข้อมูล" : "Edit"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Warehouse Locations Sub-tab */}
      {activeSubTab === "locations" && (
        <div className="flex flex-col gap-4">
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold opacity-70">{isThai ? "กรองตามสาขา/คลัง:" : "Filter by Facility:"}</span>
              <div className="min-w-[180px]">
                <CustomDropdown
                  value={selectedFacilityForLocs}
                  onChange={setSelectedFacilityForLocs}
                  options={facilityFilterOptions}
                  searchable={facilities.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                />
              </div>
            </div>
            <span className="opacity-60">{filteredLocations.length} {isThai ? "ตำแหน่งพื้นที่" : "locations found"}</span>
          </div>

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
                    <th className="p-3">{isThai ? "รหัสพิกัดจัดเก็บ" : "Location Code"}</th>
                    <th className="p-3">{isThai ? "ชื่อพื้นที่" : "Name"}</th>
                    <th className="p-3">{isThai ? "ประเภทพิกัด" : "Type"}</th>
                    <th className="p-3">{isThai ? "ระดับความลึก" : "Hierarchy Depth"}</th>
                    <th className="p-3">{isThai ? "เส้นทางอ้างอิง" : "Full Path"}</th>
                    <th className="p-3">{isThai ? "สถานะการใช้งาน" : "Status"}</th>
                    <th className="p-3 text-right">{isThai ? "จัดการ" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444444]/30">
                  {filteredLocations.map((loc) => (
                    <tr
                      key={loc.id}
                      className={`transition-colors ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="p-3 font-mono font-bold">{loc.code}</td>
                      <td className="p-3 font-semibold">{loc.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/15">
                          {loc.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono">Level {loc.depth}</td>
                      <td className="p-3 font-mono text-[11px] opacity-70">{loc.path}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            loc.status === "ACTIVE"
                              ? "bg-[#2EC4B6]/20 text-[#2EC4B6]"
                              : loc.status === "BLOCKED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {loc.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocation(loc);
                            setLocationForm(loc);
                            setIsAddLocationOpen(true);
                          }}
                          className={`p-1.5 rounded ${
                            isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                          }`}
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Departments Sub-tab */}
      {activeSubTab === "departments" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={`p-5 rounded-2xl border transition-colors flex flex-col justify-between shadow-sm ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold opacity-60">{dept.code}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateDepartment(dept.id, { isActive: !dept.isActive })}
                    className="flex items-center gap-1 text-[11px] font-bold"
                  >
                    {dept.isActive ? (
                      <span className="text-[#2EC4B6] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                        {isThai ? "เปิดใช้งาน" : "Active"}
                      </span>
                    ) : (
                      <span className="text-zinc-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        {isThai ? "ปิดการใช้งาน" : "Inactive"}
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-base mt-2">{isThai ? dept.nameTh : dept.name}</h3>
                <div className="text-xs opacity-60 mt-1">{isThai ? dept.name : dept.nameTh}</div>

                <div className="mt-3 text-xs opacity-75">
                  <span className="opacity-60">{isThai ? "หัวหน้าแผนก:" : "Department Lead:"}</span>{" "}
                  <span className="font-semibold">{dept.manager || "-"}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#444444]/30">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDept(dept);
                    setDeptForm(dept);
                    setIsAddDeptOpen(true);
                  }}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    isLight ? "hover:bg-zinc-100 text-zinc-800" : "hover:bg-white/10 text-zinc-200"
                  }`}
                >
                  <Edit size={13} />
                  <span>{isThai ? "แก้ไข" : "Edit"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Facility */}
      {isAddFacilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[500px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">
                {editingFacility ? (isThai ? "แก้ไขข้อมูลสาขา/คลัง" : "Edit Facility") : (isThai ? "เพิ่มสาขา/คลังสินค้าใหม่" : "Add Facility")}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddFacilityOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFacilitySubmit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="font-semibold opacity-80">{isThai ? "รหัสสาขา" : "Code"}</label>
                  <input
                    type="text"
                    required
                    value={facilityForm.code || ""}
                    onChange={(e) => setFacilityForm({ ...facilityForm, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="font-semibold opacity-80">{isThai ? "ชื่อสาขา" : "Name"}</label>
                  <input
                    type="text"
                    required
                    value={facilityForm.name || ""}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ประเภทสถานประกอบการ" : "Type"}</label>
                  <CustomDropdown
                    value={facilityForm.type || "BRANCH"}
                    onChange={(val) => setFacilityForm({ ...facilityForm, type: val as FacilityRecord["type"] })}
                    options={facilityTypeOptions}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ผู้จัดการสาขา" : "Manager"}</label>
                  <input
                    type="text"
                    value={facilityForm.manager || ""}
                    onChange={(e) => setFacilityForm({ ...facilityForm, manager: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ที่อยู่แบบละเอียด" : "Address"}</label>
                <textarea
                  rows={2}
                  value={facilityForm.address || ""}
                  onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none resize-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ละติจูด" : "Latitude"}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={facilityForm.latitude || 0}
                    onChange={(e) => setFacilityForm({ ...facilityForm, latitude: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ลองจิจูด" : "Longitude"}</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={facilityForm.longitude || 0}
                    onChange={(e) => setFacilityForm({ ...facilityForm, longitude: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityOpen(false)}
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
                  {isThai ? "บันทึกข้อมูล" : "Save Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Warehouse Location */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[480px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">
                {editingLocation ? (isThai ? "แก้ไขพิกัดจัดเก็บ" : "Edit Location") : (isThai ? "เพิ่มพิกัดจัดเก็บสินค้า" : "Add Location")}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddLocationOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "สาขา/คลังที่ตั้ง" : "Facility"}</label>
                <CustomDropdown
                  value={locationForm.facilityId || facilities[0]?.id || ""}
                  onChange={(val) => setLocationForm({ ...locationForm, facilityId: val })}
                  options={modalFacilityOptions}
                  searchable={facilities.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาสาขา..." : "Search facility..."}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "รหัสพิกัด" : "Location Code"}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZONE-B, AISLE-02"
                    value={locationForm.code || ""}
                    onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ประเภทพิกัด" : "Location Type"}</label>
                  <CustomDropdown
                    value={locationForm.type || "Zone"}
                    onChange={(val) => setLocationForm({ ...locationForm, type: val as LocationType })}
                    options={locationTypeOptions}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ชื่อตำแหน่ง" : "Name"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Bin North 101"
                  value={locationForm.name || ""}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ตำแหน่งแม่ (Parent Hierarchy)" : "Parent Location"}</label>
                <CustomDropdown
                  value={locationForm.parentId || ""}
                  onChange={(val) => setLocationForm({ ...locationForm, parentId: val || null })}
                  options={parentLocationOptions}
                  searchable={parentLocationOptions.length > 5}
                  searchPlaceholder={isThai ? "ค้นหาตำแหน่ง..." : "Search parent location..."}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAddLocationOpen(false)}
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
                  {isThai ? "บันทึกพิกัด" : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Department */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[440px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">
                {editingDept ? (isThai ? "แก้ไขข้อมูลแผนก" : "Edit Department") : (isThai ? "เพิ่มแผนกใหม่" : "Add Department")}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "รหัสแผนก" : "Code"}</label>
                <input
                  type="text"
                  required
                  value={deptForm.code || ""}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ชื่อแผนก (ภาษาไทย)" : "Name (Thai)"}</label>
                <input
                  type="text"
                  required
                  value={deptForm.nameTh || ""}
                  onChange={(e) => setDeptForm({ ...deptForm, nameTh: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ชื่อแผนก (English)" : "Name (English)"}</label>
                <input
                  type="text"
                  required
                  value={deptForm.name || ""}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">{isThai ? "ผู้จัดการแผนก" : "Lead"}</label>
                <input
                  type="text"
                  value={deptForm.manager || ""}
                  onChange={(e) => setDeptForm({ ...deptForm, manager: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAddDeptOpen(false)}
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
                  {isThai ? "บันทึกแผนก" : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
