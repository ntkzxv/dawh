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
  children?: ReactNode;
}

export default function SidePanel({
  item,
  onClose,
  canEdit = false,
  onEdit,
  title,
  children,
}: SidePanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  if (children !== undefined) {
    return (
      <div
        className="fixed inset-0 z-[90] flex items-stretch justify-end bg-black/70 backdrop-blur-xs"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="side-panel-title"
          className={`flex h-full w-full max-w-[480px] shrink-0 flex-col overflow-y-auto border-l shadow-2xl transition-colors ${
            isLight
              ? "border-[#E4E4E7] bg-white"
              : "border-[#444444] bg-[#383838]"
          }`}
        >
          <div className="flex w-full items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-white/10">
            <h3 id="side-panel-title" className="text-base font-bold">
              {title ?? (isThai ? "รายละเอียด" : "Details")}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={isThai ? "ปิดแผงด้านข้าง" : "Close side panel"}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-black dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </aside>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-stretch justify-end bg-black/70 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className={`h-full w-full max-w-[380px] shrink-0 rounded-l-[8px] border-y border-l border-r-0 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl transition-colors ${
          isLight
            ? "bg-white border-[#E4E4E7]"
            : "bg-[#383838] border-[#444444]"
        }`}
      >
        {/* drawer-header */}
        <div className="w-full flex items-center justify-between">
          <h3
            id="product-detail-title"
            className={`font-bold text-[16px] leading-[21px] ${
              isLight ? "text-[#222222]" : "text-[#F8FAFC]"
            }`}
          >
            {isThai ? "รายละเอียดสินค้า" : "Item Details"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={isThai ? "ปิดรายละเอียด" : "Close details"}
            className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer p-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Image Showcase */}
        <div className="w-full h-[180px] rounded-[8px] border border-[#444444]/40 bg-[#2C2C2C] flex flex-col items-center justify-center text-[#A1A1AA] overflow-hidden relative shadow-inner">
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
      </aside>
    </div>
  );
}
