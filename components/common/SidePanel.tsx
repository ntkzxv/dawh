"use client";

import { type ReactNode } from "react";
import { X, Edit, Plus } from "lucide-react";
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
  group?: string;
  model?: string;
  unitName?: string;
  cost?: number | null;
  salePrice?: number | null;
  active?: boolean;
  serialTracked?: boolean;
  branchStock?: Array<{ branchId: number; branchName: string; quantity: number }>;
}

export interface SidePanelProps {
  item: ProductDetailItem | null;
  onClose: () => void;
  canEdit?: boolean;
  onEdit?: (item: ProductDetailItem) => void;
  canAdjust?: boolean;
  onAdjust?: (item: ProductDetailItem) => void;
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
  const { theme } = useTheme();
  const colors = tone === "error"
    ? "border-[#E71D36]/30 bg-[#E71D36]/10 text-[#E71D36]"
    : theme === "light"
      ? "border-[#E4E4E7] bg-[#F4F4F5] text-[#222222]"
      : "border-[#444444] bg-[#333333] text-[#F8FAFC]";

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
  canAdjust = false,
  onAdjust,
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
          <h3
            id="product-detail-title"
            className={`text-[18px] font-bold leading-[24px] ${
              isLight ? "text-[#222222]" : "text-[#F8FAFC]"
            }`}
          >
            {item.name}
          </h3>
          <div className={`mt-1 font-mono text-[12px] font-semibold ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            SKU: {item.sku}
          </div>
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

        {/* specs */}
        <div className="w-full flex flex-col gap-2.5 text-[13px]">
          <DetailRow label={isThai ? "กลุ่มสินค้า" : "Product group"} value={item.group ?? "-"} isLight={isLight} />
          <DetailRow label={isThai ? "หมวดหมู่" : "Category"} value={item.category} isLight={isLight} />
          <DetailRow label={isThai ? "ยี่ห้อ" : "Brand"} value={item.brand} isLight={isLight} />
          <DetailRow label={isThai ? "รุ่น" : "Model"} value={item.model ?? "-"} isLight={isLight} />
          <DetailRow label={isThai ? "หน่วยนับ" : "Unit"} value={item.unitName ?? item.unit} isLight={isLight} />
          <DetailRow label={isThai ? "รหัสหน่วยนับ" : "Unit code"} value={item.unit} isLight={isLight} />
          <DetailRow label={isThai ? "ต้นทุนต่อหน่วย" : "Unit cost"} value={item.cost == null ? "-" : `${item.cost.toLocaleString()} ${isThai ? "บาท" : "THB"}`} isLight={isLight} />
          <DetailRow label={isThai ? "ราคาขาย" : "Sale price"} value={item.salePrice == null ? "-" : `${item.salePrice.toLocaleString()} ${isThai ? "บาท" : "THB"}`} isLight={isLight} />
          <DetailRow label={isThai ? "สต็อกขั้นต่ำ" : "Reorder point"} value={item.minStock == null ? "-" : `${item.minStock.toLocaleString()} ${item.unit}`} isLight={isLight} />
          <DetailRow label={isThai ? "สถานะสต็อก" : "Stock status"} value={item.status === "out_of_stock" ? (isThai ? "สินค้าหมด" : "Out of stock") : item.status === "low_stock" ? (isThai ? "สินค้าใกล้หมด" : "Low stock") : (isThai ? "ปกติ" : "In stock")} isLight={isLight} />
          {item.active !== undefined && <DetailRow label={isThai ? "สถานะสินค้า" : "Product status"} value={item.active ? (isThai ? "เปิดใช้งาน" : "Active") : (isThai ? "ปิดใช้งาน" : "Inactive")} isLight={isLight} />}
          {item.serialTracked !== undefined && <DetailRow label={isThai ? "ติดตามเลขซีเรียล" : "Serial tracking"} value={item.serialTracked ? (isThai ? "เปิด" : "Enabled") : (isThai ? "ปิด" : "Disabled")} isLight={isLight} />}
        </div>

        <section className={`rounded-lg border p-4 ${isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#444444] bg-[#222222]"}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className={`text-sm font-bold ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>{isThai ? "คงเหลือแยกตามสาขา" : "Stock by branch"}</h4>
            <span className={`font-mono text-sm font-bold ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>{item.onHand.toLocaleString()} {item.unit}</span>
          </div>
          {item.branchStock?.length ? <div className="space-y-2">
            {item.branchStock.map((branch) => <div key={branch.branchId} className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px] ${isLight ? "bg-white" : "bg-[#2C2C2C]"}`}>
              <span className={isLight ? "text-[#444444]" : "text-[#E4E4E7]"}>{branch.branchName}</span>
              <span className={`shrink-0 font-mono font-semibold ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>{branch.quantity.toLocaleString()} {item.unit}</span>
            </div>)}
          </div> : <div className="text-[13px] text-[#A1A1AA]">{isThai ? "ไม่มีสินค้าในสาขา" : "No stock at any branch"}</div>}
        </section>

        <a
          className={`text-sm underline ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}
          href="/warehouse/movements"
        >
          {isThai ? "ดูประวัติการเคลื่อนไหวสต๊อก" : "View stock movements"}
        </a>

        {/* drawer-actions */}
        {(canEdit || canAdjust) && (
          <div className="w-full flex items-center gap-3 pt-2">
            {canEdit && (
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
            )}

            {canAdjust && (
              <button
                type="button"
                onClick={() => onAdjust?.(item)}
                className={`flex-1 h-[41px] px-4 py-3 rounded-[6px] flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors cursor-pointer ${isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`}
              >
                <Plus size={14} />
                <span>{isThai ? "ปรับปรุงยอด" : "Adjust"}</span>
              </button>
            )}
          </div>
        )}
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value, isLight }: { label: string; value: string; isLight: boolean }) {
  return <div className="flex items-start justify-between gap-4">
    <span className="shrink-0 text-[#A1A1AA]">{label}</span>
    <span className={`text-right font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>{value}</span>
  </div>;
}
