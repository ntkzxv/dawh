"use client";

import { type ReactNode } from "react";
import { X, Package, Edit, Plus } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export interface ProductDetailItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  onHand: number;
  warehouse: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  unit: string;
  price: number | null;
  description?: string;
  minStock?: number;
}

export interface SidePanelProps {
  item: ProductDetailItem | null;
  onClose: () => void;
  canEdit?: boolean;
  onEdit?: (item: ProductDetailItem) => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
}

export function SidePanelAlert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success";
}) {
  const colors = tone === "error"
    ? "border-[#E71D36]/30 bg-[#E71D36]/10 text-[#E71D36]"
    : "border-[#2EC4B6]/30 bg-[#2EC4B6]/10 text-[#2EC4B6]";

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[8px] border p-3.5 text-[13px] font-medium ${colors}`}>
      {children}
    </div>
  );
}

export const sidePanelInvalidFieldClassName = "!border-[#E74C3C] dark:!border-[#E71D36]";

export function SidePanelFieldError({ children }: { children: ReactNode }) {
  return (
    <span role="alert" className="mt-1 block text-xs text-[#E74C3C] dark:text-[#E71D36]">
      {children}
    </span>
  );
}

export function sidePanelFormStyles(isLight: boolean) {
  return {
    form: "flex-1 flex flex-col justify-between pt-6 text-xs min-h-0",
    content: "space-y-6 overflow-y-auto pr-1",
    section: "flex flex-col gap-3",
    dividedSection: "flex flex-col gap-3 border-t border-[#444444]/20 pt-2",
    field: "flex flex-col gap-1.5",
    label: `text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`,
    input: `h-[38px] w-full rounded-[8px] border px-3.5 text-[13px] outline-none transition-colors ${isLight ? "border-[#E5E5E5] bg-[#F5F5F5] text-[#222222] focus:border-[#222222]" : "border-[#444444] bg-[#222222] text-[#F4F4F5] focus:border-[#E4E4E7]"}`,
    dropdown: `h-[38px] rounded-[8px] border px-3.5 !text-[13px] ${isLight ? "border-[#E5E5E5] bg-[#F5F5F5] text-[#222222]" : "border-[#444444] bg-[#222222] text-[#F4F4F5]"}`,
    footer: "mt-6 flex shrink-0 items-center justify-end gap-3 border-t border-[#444444]/30 pt-5",
    cancel: `h-[42px] rounded-[8px] border px-6 text-[14px] font-bold cursor-pointer transition-colors ${isLight ? "border-[#E4E4E7] bg-white text-[#222222] hover:bg-[#F4F4F5]" : "border-[#444444] bg-[#383838] text-[#F4F4F5] hover:bg-[#444444]"}`,
    submit: `h-[42px] rounded-[8px] px-6 text-[14px] font-bold cursor-pointer shadow-sm transition-colors disabled:opacity-50 ${isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`,
  };
}

export default function SidePanel({
  item,
  onClose,
  canEdit = false,
  onEdit,
  title,
  eyebrow,
  children,
}: SidePanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  if (children !== undefined) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-stretch justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="side-panel-title"
          className={`relative flex h-full w-full max-w-[560px] shrink-0 flex-col overflow-hidden border-l p-5 shadow-2xl transition-all animate-in slide-in-from-right duration-300 sm:p-6 ${
            isLight
              ? "border-[#E4E4E7] bg-white"
              : "border-[#444444] bg-[#282828]"
          }`}
        >
          <div className="w-full shrink-0 border-b border-[#444444]/30 pb-3 pr-8">
            {eyebrow && (
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                {eyebrow}
              </div>
            )}
            <h3
              id="side-panel-title"
              className={`text-[18px] font-bold leading-[24px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}
            >
              {title ?? (isThai ? "รายละเอียด" : "Details")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isThai ? "ปิดแผงด้านข้าง" : "Close side panel"}
            className={`absolute right-4 top-4 z-10 rounded-[8px] p-1.5 transition-colors ${
              isLight
                ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]"
                : "text-[#A1A1AA] hover:bg-[#444444] hover:text-white"
            }`}
          >
            <X size={18} />
          </button>
          <div className="-mr-5 min-h-0 flex-1 overflow-y-auto pr-5 sm:-mr-6 sm:pr-6">{children}</div>
        </aside>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-stretch justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className={`relative flex h-full w-full max-w-[560px] shrink-0 flex-col overflow-hidden border-l p-5 shadow-2xl transition-all animate-in slide-in-from-right duration-300 sm:p-6 ${
          isLight
            ? "border-[#E4E4E7] bg-white"
            : "border-[#444444] bg-[#282828]"
        }`}
      >
        <div className="w-full shrink-0 border-b border-[#444444]/30 pb-3 pr-8">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
            {isThai ? "สินค้า" : "Product"}
          </div>
          <h3
            id="product-detail-title"
            className={`text-[18px] font-bold leading-[24px] ${
              isLight ? "text-[#222222]" : "text-[#F8FAFC]"
            }`}
          >
            {isThai ? "รายละเอียดสินค้า" : "Item Details"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={isThai ? "ปิดรายละเอียด" : "Close details"}
          className={`absolute right-4 top-4 z-10 rounded-[8px] p-1.5 transition-colors ${isLight ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]" : "text-[#A1A1AA] hover:bg-[#444444] hover:text-white"}`}
        >
          <X size={18} />
        </button>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-6">

        {/* Product Image Showcase */}
        <div className={`relative flex h-[180px] w-full flex-col items-center justify-center overflow-hidden rounded-[8px] border text-[#A1A1AA] shadow-inner ${isLight ? "border-[#E4E4E7] bg-[#F5F5F5]" : "border-[#444444] bg-[#222222]"}`}>
          <Package size={48} className="opacity-40" />
          <span className="text-[11.5px] mt-2 font-mono text-[#A1A1AA]/80">
            {item.sku}
          </span>
        </div>

        {/* item-info */}
        <div className="w-full flex flex-col gap-2">
          <span className="font-mono font-semibold text-[12px] text-[#0D99FF]">
            {item.sku}
          </span>
          <h4
            className={`font-bold text-[18px] leading-[23px] ${
              isLight ? "text-[#222222]" : "text-[#F8FAFC]"
            }`}
          >
            {item.name}
          </h4>
        </div>

        {/* Line divider */}
        <div
          className={`w-full border-b ${
            isLight ? "border-[#E4E4E7]" : "border-[#444444]"
          }`}
        />

        {/* specs */}
        <div className="w-full flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "หมวดหมู่หลัก" : "Category"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.category}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "ยี่ห้อ" : "Brand"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.brand}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "คลังที่มีสินค้า" : "Warehouse"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.warehouse}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "หน่วยนับ" : "Unit"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.unit}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "ราคาต่อหน่วย" : "Unit Price"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.price == null
                ? "-"
                : `${item.price.toLocaleString()} ${isThai ? "บาท" : "THB"}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA]">
              {isThai ? "ระดับสต็อกขั้นต่ำ" : "Safety Stock"}
            </span>
            <span
              className={`font-medium ${
                isLight ? "text-[#222222]" : "text-[#F8FAFC]"
              }`}
            >
              {item.minStock == null
                ? "-"
                : `${item.minStock} ${item.unit}`}
            </span>
          </div>
        </div>

        <a
          className="text-sm text-indigo-500 underline"
          href="/warehouse/movements"
        >
          {isThai ? "ดูประวัติการเคลื่อนไหวสต๊อก" : "View stock movements"}
        </a>

        {/* drawer-actions */}
        {canEdit && (
          <div className="w-full flex items-center gap-3 pt-2">
            {/* btn-edit */}
            <button
              type="button"
              onClick={() => onEdit?.(item)}
              className={`flex-1 h-[41px] px-4 py-3 rounded-[6px] border flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                isLight
                  ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222] hover:bg-slate-200"
                  : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-[#333333]"
              }`}
            >
              <Edit size={14} />
              <span>{isThai ? "แก้ไขข้อมูล" : "Edit"}</span>
            </button>

            {/* btn-receive */}
            <button
              type="button"
              onClick={() => onEdit?.(item)}
              className="flex-1 h-[41px] px-4 py-3 rounded-[6px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-white bg-[#2EC4B6] hover:bg-[#25A99D] transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{isThai ? "ปรับปรุงยอด" : "Adjust"}</span>
            </button>
          </div>
        )}
        </div>
      </aside>
    </div>
  );
}
