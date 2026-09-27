"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Plus, X } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import {
  warehouseApi,
  type CatalogItem,
  type CatalogKind,
} from "@/lib/api/warehouse";
import { Empty, message, Notice, useRemote } from "./Ui";
import { useTheme } from "@/context/ThemeContext";
import CustomDropdown from "@/components/common/CustomDropdown";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { Pagination } from "@/components/common";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { canEditCatalog } from "@/lib/contracts/warehouse-policy";

const kinds: Array<{ key: CatalogKind; label: string }> = [
  { key: "branches", label: "สาขา" },
  { key: "warehouses", label: "คลัง" },
  { key: "suppliers", label: "ผู้ขาย" },
  { key: "units", label: "หน่วยสินค้า" },
  { key: "product-groups", label: "กลุ่มสินค้า" },
  { key: "product-categories", label: "หมวดสินค้า" },
  { key: "brands", label: "ยี่ห้อ" },
  { key: "product-models", label: "รุ่น" },
  { key: "products", label: "สินค้า" },
];

const labels: Record<string, string> = {
  sku: "รหัสสินค้า",
  code: "รหัส",
  name: "ชื่อ",
  address: "ที่อยู่",
  contact: "ผู้ติดต่อ",
  phone: "โทรศัพท์",
  cost: "ต้นทุน",
  salePrice: "ราคาขาย",
  reorderPoint: "จุดสั่งซื้อ",
  serialTracked: "ติดตาม Serial",
  branchId: "สาขา",
  unitId: "หน่วย",
  groupId: "กลุ่มสินค้า",
  categoryId: "หมวดสินค้า",
  brandId: "ยี่ห้อ",
  modelId: "รุ่น",
};

const fields: Record<CatalogKind, string[]> = {
  branches: ["code", "name", "address"],
  warehouses: ["branchId", "code", "name"],
  suppliers: ["code", "name", "contact", "phone", "address"],
  units: ["code", "name"],
  "product-groups": ["name"],
  "product-categories": ["name", "groupId"],
  brands: ["name"],
  "product-models": ["name", "brandId"],
  products: [
    "sku",
    "name",
    "unitId",
    "groupId",
    "categoryId",
    "brandId",
    "modelId",
    "serialTracked",
    "cost",
    "salePrice",
    "reorderPoint",
  ],
};

const referenceKind: Record<string, CatalogKind> = {
  branchId: "branches",
  unitId: "units",
  groupId: "product-groups",
  categoryId: "product-categories",
  brandId: "brands",
  modelId: "product-models",
};

const toDbKey = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export default function CatalogScreen({
  initialKind = "products",
}: {
  initialKind?: CatalogKind;
}) {
  const account = useOptionalWarehouseAccount();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const kind = initialKind;
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 16 });
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const requiredRefs = useMemo(
    () => [
      ...new Set(
        fields[kind]
          .map((field) => referenceKind[field])
          .filter((reference): reference is CatalogKind => Boolean(reference)),
      ),
    ],
    [kind],
  );
  const load = useCallback(
    (signal: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      return warehouseApi.catalogPage(kind, params, signal);
    },
    [kind, currentPage],
  );
  const loadRefs = useCallback(
    async (signal: AbortSignal) => {
      const rows = await Promise.all(
        requiredRefs.map((reference) =>
          warehouseApi.catalog(reference, signal),
        ),
      );
      return Object.fromEntries(
        requiredRefs.map((reference, index) => [reference, rows[index]]),
      ) as Record<string, CatalogItem[]>;
    },
    [requiredRefs],
  );
  const { data: refs } = useRemote(loadRefs, { enabled: isFormOpen });

  const { data, error, refresh } = useRemote(load);
  const currentData = data?.page.page === currentPage ? data : null;
  const totalItems = data?.page.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayedPage = currentPage;
  const visibleRows = currentData?.items ?? [];
  useEffect(() => {
    if (!data || totalPages < 1 || currentPage <= totalPages) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setCurrentPage(totalPages);
    });
    return () => {
      active = false;
    };
  }, [data, totalPages, currentPage]);
  const canEdit = !!currentData && canEditCatalog(account?.me?.role, kind);

  const save = async (body: Record<string, unknown>) => {
    setFailure(null);
    setSuccess(null);
    try {
      if (editing) {
        await warehouseApi.updateCatalog(kind, editing.id, body);
      } else {
        await warehouseApi.createCatalog(kind, body);
      }
      setSuccess(editing ? "แก้ไขแล้ว" : "เพิ่มข้อมูลแล้ว");
      setEditing(null);
      setIsFormOpen(false);
      await refresh();
    } catch (cause) {
      setFailure(message(cause));
    }
  };

  const surface = isLight
    ? "bg-white border-[#E4E4E7]"
    : "bg-[#383838] border-[#444444]";
  const kindLabel =
    kinds.find((item) => item.key === kind)?.label ?? "ข้อมูลหลัก";
  const openForm = (item: CatalogItem | null) => {
    setEditing(item);
    const rect = addButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setPopoverPosition({
        top: Math.min(rect.bottom + 8, Math.max(16, window.innerHeight - 420)),
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
    setIsFormOpen(true);
  };
  const closeForm = useCallback(() => {
    setEditing(null);
    setIsFormOpen(false);
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeForm);
    window.addEventListener("scroll", closeForm, true);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeForm);
      window.removeEventListener("scroll", closeForm, true);
    };
  }, [isFormOpen, closeForm]);

  return (
    <WarehousePageTemplate
      titleEn="Master data"
      titleTh={kindLabel}
      routePath="/warehouse/inventory"
      iconName="box"
      fullBleed
    >
      <div className="flex w-full min-h-0 flex-1 flex-col gap-6 self-stretch overflow-y-auto p-6 lg:p-8">
        {error && <Notice tone="error">{error}</Notice>}
        {failure && <Notice tone="error">{failure}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        {!currentData && !error && (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                className={`text-base font-bold ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}
              >
                รายการทั้งหมด
              </h2>
              <SkeletonBox className="h-[33px] w-32 rounded-[6px]" />
            </div>
            <section
              role="status"
              aria-label="กำลังโหลดข้อมูล"
              className={`w-full overflow-hidden rounded-[12px] border p-4 shadow-sm ${surface}`}
            >
              <div className="space-y-0">
                <div
                  className={`grid grid-cols-[1fr_2fr_1fr_48px] gap-3 rounded-[6px] px-3 py-3 ${isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"}`}
                >
                  {["w-16", "w-20", "w-14", "w-5"].map((width, index) => (
                    <SkeletonBox key={index} className={`h-3 ${width}`} />
                  ))}
                </div>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={`grid h-[56px] grid-cols-[1fr_2fr_1fr_48px] items-center gap-3 border-b px-3 ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}
                  >
                    <SkeletonBox className="h-3.5 w-20" />
                    <SkeletonBox className="h-3.5 w-3/4" />
                    <SkeletonBox className="h-5 w-14 rounded-full" />
                    <SkeletonBox className="ml-auto size-8 rounded-[6px]" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentData && (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                className={`text-base font-bold ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}
              >
                รายการทั้งหมด
              </h2>
              {canEdit && (
                <button
                  type="button"
                  ref={addButtonRef}
                  aria-label={`เพิ่ม${kindLabel}`}
                  className={`inline-flex h-[33px] shrink-0 items-center gap-1.5 rounded-[6px] px-4 text-[13px] font-semibold transition-colors cursor-pointer ${isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`}
                  onClick={() => openForm(null)}
                >
                  <Plus size={14} />
                  เพิ่ม{kindLabel}
                </button>
              )}
            </div>

            <section
              className={`w-full overflow-hidden rounded-[12px] border p-4 shadow-sm ${surface}`}
            >
              {currentData.items.length ? (
                <div className="overflow-x-auto">
                  <table
                    className={`w-full min-w-[520px] text-left text-[13px] ${isLight ? "text-[#383838]" : "text-[#E4E4E7]"}`}
                  >
                    <thead
                      className={
                        isLight
                          ? "bg-[#F4F4F5] text-[#666666]"
                          : "bg-[#2C2C2C] text-[#A1A1AA]"
                      }
                    >
                      <tr className="h-[36px]">
                        <th className="rounded-l-[6px] px-3 py-2 text-xs font-semibold">
                          รหัส
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold">
                          ชื่อ
                        </th>
                        <th className="w-[120px] px-3 py-2 text-xs font-semibold">
                          สถานะ
                        </th>
                        <th
                          className="w-[88px] rounded-r-[6px] px-3 py-2"
                          aria-label="การทำงาน"
                        />
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}
                    >
                      {visibleRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`h-[56px] transition-colors ${isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"}`}
                        >
                          <td className="px-3 py-3 font-mono">
                            {row.sku ?? row.code ?? row.id}
                          </td>
                          <td className="px-3 py-3 font-medium">{row.name}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                row.active === false
                                  ? "bg-[#E74C3C]/15 text-[#E74C3C]"
                                  : "bg-[#2EC4B6]/15 text-[#2EC4B6]"
                              }`}
                            >
                              {row.active === false ? "ปิดใช้" : "ใช้งาน"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {canEdit && (
                              <button
                                type="button"
                                className={`rounded-[4px] px-2 py-1 font-semibold transition-colors cursor-pointer ${isLight ? "text-[#222222] hover:bg-[#E4E4E7]" : "text-white hover:bg-[#444444]"}`}
                                onClick={() => openForm(row)}
                              >
                                แก้ไข
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="ยังไม่มีข้อมูล เพิ่มรายการแรกจากปุ่มด้านบน" />
              )}
            </section>
            <Pagination
              currentPage={displayedPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              className="px-1"
            />
          </div>
        )}

        {isFormOpen && canEdit && currentData && (
          <div
            className="fixed inset-0 z-[100]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-labelledby="catalog-form-title"
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                top: popoverPosition.top,
                right: popoverPosition.right,
                maxHeight: `calc(100vh - ${popoverPosition.top}px - 16px)`,
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
              }}
              className={`fixed flex w-[min(360px,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-[12px] border p-4 sm:p-5 transition-colors ${isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F4F4F5]"}`}
            >
              {/* Absolute Close Button at Top-Right */}
              <button
                type="button"
                aria-label="ปิดฟอร์ม"
                className={`absolute top-3.5 right-3.5 rounded-[6px] p-1 transition-colors cursor-pointer z-10 ${
                  isLight
                    ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]"
                    : "text-[#A1A1AA] hover:bg-[#444444] hover:text-[#F4F4F5]"
                }`}
                onClick={closeForm}
              >
                <X size={18} />
              </button>

              {/* Header Title (Not sharing inline space with close button) */}
              <div className="w-full border-b border-[#444444]/30 pb-2.5 pr-8">
                <h2
                  id="catalog-form-title"
                  className={`text-[16px] font-bold ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}
                >
                  {editing ? "แก้ไข" : "เพิ่ม"}
                  {kinds.find((item) => item.key === kind)?.label}
                </h2>
              </div>

              {requiredRefs.length > 0 && !refs ? (
                <p className="py-5 text-sm">กำลังโหลดข้อมูลสำหรับฟอร์ม...</p>
              ) : (
                <CatalogForm
                  key={`${kind}-${editing?.id ?? "new"}`}
                  kind={kind}
                  current={editing}
                  refs={refs ?? {}}
                  isLight={isLight}
                  onSave={save}
                  onCancel={closeForm}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </WarehousePageTemplate>
  );
}

function CatalogForm({
  kind,
  current,
  refs,
  isLight,
  onSave,
  onCancel,
}: {
  kind: CatalogKind;
  current: CatalogItem | null;
  refs: Record<string, CatalogItem[]>;
  isLight: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(
    () =>
      Object.fromEntries(
        fields[kind].map((key) => [
          key,
          current?.[toDbKey(key)] ?? (key === "serialTracked" ? false : ""),
        ]),
      ) as Record<string, string | boolean>,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body: Record<string, unknown> = {};
    for (const key of fields[kind]) {
      const value = values[key];
      body[key] =
        key === "serialTracked"
          ? value === true
          : referenceKind[key]
            ? value
              ? Number(value)
              : null
            : value === "" && !["sku", "code", "name"].includes(key)
              ? null
              : value;
    }
    if (current && "active" in current)
      body.active = values.active ?? current.active ?? true;
    onSave(body);
  };

  const formFields = fields[kind].filter(
    (key) => !(current && key === "branchId"),
  );

  const isMultiField = formFields.length > 1;

  const inputFrameStyle = `box-border flex flex-row items-center px-[12px] py-[10px] gap-2 w-full max-w-[160px] h-[38px] rounded-[8px] border text-[13px] leading-[17px] font-normal outline-none transition-colors ${
    isLight
      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
      : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
  }`;

  const labelStyle = `font-bold text-[12px] leading-[16px] ${isLight ? "text-[#555555]" : "text-[#E4E4E7]"}`;

  return (
    <form
      className="ml-auto flex w-full max-w-[320px] flex-col items-center gap-5"
      onSubmit={submit}
    >
      <div
        className={`w-full ${formFields.length === 1 ? "max-w-[160px]" : isMultiField ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}`}
      >
        {formFields.map((key) => {
          const isFullWidth =
            key === "address" ||
            (key === "name" &&
              (kind === "suppliers" ||
                kind === "branches" ||
                kind === "warehouses"));
          return (
            <div
              key={key}
              className={`flex flex-col items-start gap-[6px] w-full ${isFullWidth ? "sm:col-span-2" : ""}`}
            >
              <label className={labelStyle}>
                {labels[key] ?? key}{" "}
                {["sku", "code", "name"].includes(key) && (
                  <span className="text-[#E71D36]">*</span>
                )}
              </label>

              {key === "serialTracked" ? (
                <label className="flex items-center gap-2 cursor-pointer text-[13px] h-[38px]">
                  <input
                    type="checkbox"
                    className="rounded border-[#444444] bg-[#2C2C2C] text-[#222222] focus:ring-0"
                    checked={values[key] === true}
                    onChange={(event) =>
                      setValues({ ...values, [key]: event.target.checked })
                    }
                  />
                  <span
                    className={isLight ? "text-[#222222]" : "text-[#F4F4F5]"}
                  >
                    เปิดใช้งานการติดตาม Serial
                  </span>
                </label>
              ) : referenceKind[key] ? (
                <CustomDropdown
                  value={String(values[key] ?? "")}
                  onChange={(value) => setValues({ ...values, [key]: value })}
                  options={[
                    { value: "", label: `เลือก${labels[key]}` },
                    ...(refs[referenceKind[key]] ?? [])
                      .filter((item) => item.active !== false)
                      .map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      })),
                  ]}
                  searchable
                  className="w-full"
                  triggerClassName={inputFrameStyle}
                />
              ) : key === "address" ? (
                <textarea
                  rows={2}
                  className={`box-border flex w-full rounded-[8px] border p-2.5 text-[13px] leading-[18px] font-normal outline-none transition-colors resize-none ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                  }`}
                  value={String(values[key] ?? "")}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                  placeholder={`กรอก${labels[key] ?? key}`}
                />
              ) : (
                <input
                  className={inputFrameStyle}
                  required={["sku", "code", "name"].includes(key)}
                  type={
                    ["cost", "salePrice", "reorderPoint"].includes(key)
                      ? "number"
                      : key === "phone"
                        ? "tel"
                        : "text"
                  }
                  min={key === "reorderPoint" ? "0" : undefined}
                  step={
                    ["cost", "salePrice"].includes(key)
                      ? "0.01"
                      : key === "reorderPoint"
                        ? "0.001"
                        : undefined
                  }
                  value={String(values[key] ?? "")}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                  placeholder={`กรอก${labels[key] ?? key}`}
                />
              )}
            </div>
          );
        })}

        {current && "active" in current && (
          <div
            className={`flex flex-col items-start gap-[6px] w-full ${isMultiField ? "sm:col-span-2" : ""}`}
          >
            <label className={labelStyle}>สถานะการใช้งาน</label>
            <CustomDropdown
              value={String(values.active ?? current.active ?? true)}
              onChange={(value) =>
                setValues({ ...values, active: value === "true" })
              }
              options={[
                { value: "true", label: "ใช้งาน" },
                { value: "false", label: "ปิดใช้" },
              ]}
              className="w-full"
              triggerClassName={inputFrameStyle}
            />
          </div>
        )}
      </div>

      {/* Actions (Bottom-Right aligned) */}
      <div className="flex flex-row justify-end items-center gap-[10px] w-full pt-1">
        {/* btn-secondary */}
        <button
          type="button"
          onClick={onCancel}
          className={`box-border flex flex-row justify-center items-center px-5 py-2.5 min-w-[84px] h-[38px] rounded-[8px] border font-bold text-[13px] leading-[18px] transition-colors cursor-pointer ${
            isLight
              ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5]"
              : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-[#444444]"
          }`}
        >
          ยกเลิก
        </button>

        {/* btn-primary */}
        <button
          type="submit"
          className={`box-border flex flex-row justify-center items-center px-5 py-2.5 min-w-[96px] h-[38px] rounded-[8px] font-bold text-[13px] leading-[18px] transition-colors cursor-pointer ${
            isLight
              ? "bg-[#222222] text-[#F4F4F5] hover:bg-black"
              : "bg-white hover:bg-[#F4F4F5] text-[#222222]"
          }`}
        >
          {current ? "บันทึก" : "เพิ่มข้อมูล"}
        </button>
      </div>
    </form>
  );
}
