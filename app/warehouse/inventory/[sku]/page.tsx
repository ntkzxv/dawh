"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WarehousePageTemplate from "../../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  listProducts,
  listProductBarcodes,
  listProductUnits,
} from "@/lib/api/products";
import { listStockBalances } from "@/lib/api/stock";
import { listFacilities } from "@/lib/api/master-data";
import type { Product } from "@/lib/products/types";
import type { StockBalance } from "@/lib/stock/types";
import type { Facility } from "@/lib/facilities/types";
import {
  ArrowLeft,
  Barcode as BarcodeIcon,
  Package,
  Layers,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  TrendingUp,
  MapPin,
  RefreshCw,
  Printer,
  ArrowRightLeft,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  const resolvedParams = use(params);
  const sku = decodeURIComponent(resolvedParams.sku);

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [barcodes, setBarcodes] = useState<Array<{ barcode: string; barcodeType: string; isPrimary: boolean }>>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProductDetail() {
      setIsLoading(true);
      setApiError(null);
      try {
        const [pRes, bRes, fRes] = await Promise.allSettled([
          listProducts(`?search=${encodeURIComponent(sku)}&limit=10`),
          listStockBalances(`?limit=250`),
          listFacilities(),
        ]);

        if (pRes.status === "fulfilled" && Array.isArray(pRes.value?.data)) {
          const prods = pRes.value.data as Product[];
          const found = prods.find((p) => p.sku.toUpperCase() === sku.toUpperCase()) || prods[0];
          if (found && isMounted) {
            setProduct(found);
            setBarcodes(found.barcodes || []);
          }
        }

        if (bRes.status === "fulfilled" && Array.isArray(bRes.value?.data)) {
          if (isMounted) {
            setBalances(bRes.value.data as StockBalance[]);
          }
        }

        if (fRes.status === "fulfilled" && Array.isArray(fRes.value?.data)) {
          if (isMounted) {
            setFacilities(fRes.value.data as Facility[]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setApiError(err instanceof Error ? err.message : "Error loading product");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProductDetail();
    return () => {
      isMounted = false;
    };
  }, [sku]);

  // Filter balances for this product
  const productBalances = balances.filter(
    (b) => b.productId === product?.id || b.sku.toUpperCase() === sku.toUpperCase()
  );

  const totalOnHand = productBalances.reduce(
    (sum, b) => sum + (parseFloat(b.quantity) || 0),
    0
  );

  const cost = parseFloat(product?.standardCost || "0");
  const totalValuation = totalOnHand * cost;

  return (
    <WarehousePageTemplate
      titleEn="Product Master Detail"
      titleTh="ข้อมูลรายละเอียดสินค้าหลัก"
      routePath="/warehouse/inventory"
    >
      <div
        className={`w-full flex flex-col p-4 sm:p-6 lg:p-8 gap-6 ${
          isLight ? "text-[#222222]" : "text-[#F8FAFC]"
        }`}
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
      >
        {/* Top Back Navigation */}
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/warehouse/inventory")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
              isLight
                ? "bg-white border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                : "bg-[#383838] border-[#444444] text-white hover:bg-[#444444]"
            }`}
          >
            <ArrowLeft size={16} />
            <span>{isThai ? "กลับไปหน้าข้อมูลสินค้าหลัก" : "Back to Inventory"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-white hover:bg-[#444444]"
              }`}
            >
              <Printer size={15} />
              <span>{isThai ? "พิมพ์ข้อมูล" : "Print"}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/warehouse/transfer")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
                isLight ? "bg-slate-900 hover:bg-black text-white" : "bg-white hover:bg-zinc-200 text-black"
              }`}
            >
              <ArrowRightLeft size={15} />
              <span>{isThai ? "โอนย้ายสต็อก" : "Transfer Stock"}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-teal-500" />
            <span className="text-[14px] text-zinc-400">
              {isThai ? "กำลังโหลดข้อมูลสินค้า..." : "Loading product details..."}
            </span>
          </div>
        ) : !product ? (
          <div
            className={`w-full p-8 rounded-xl border text-center ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <Package size={40} className="mx-auto text-zinc-400 mb-2 opacity-50" />
            <h3 className="text-[16px] font-bold">
              {isThai ? "ไม่พบข้อมูลสินค้า SKU นี้ในระบบ" : "Product SKU not found"}
            </h3>
            <p className="text-[13px] text-zinc-500 mt-1">
              SKU: {sku}
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            {/* Hero Header Card */}
            <div
              className={`w-full p-6 rounded-[14px] border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 text-[#2EC4B6]">
                  <Package size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-mono mb-1">
                    <span className="font-bold text-teal-500">{product.sku}</span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{product.category?.name || "General"}</span>
                  </div>
                  <h1 className="text-[20px] font-bold">
                    {isThai ? product.nameTh : product.nameEn || product.nameTh}
                  </h1>
                  {product.nameEn && product.nameEn !== product.nameTh && (
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{product.nameEn}</p>
                  )}
                </div>
              </div>

              {/* Stat Counters */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-white/10 pt-4 md:pt-0 md:pl-6">
                <div>
                  <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                    {isThai ? "คงเหลือรวมทุกคลัง" : "Total On Hand"}
                  </div>
                  <div className="text-[20px] font-bold font-mono text-[#2EC4B6]">
                    {totalOnHand.toLocaleString()}{" "}
                    <span className="text-[12px] font-normal text-zinc-400">{product.baseUnit?.code}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                    {isThai ? "ราคาต้นทุนเฉลี่ย" : "Unit Cost"}
                  </div>
                  <div className="text-[20px] font-bold font-mono">
                    {cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    <span className="text-[12px] font-normal text-zinc-400">THB</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                    {isThai ? "มูลค่ารวมในคลัง" : "Total Value"}
                  </div>
                  <div className="text-[20px] font-bold font-mono text-emerald-400">
                    {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    <span className="text-[12px] font-normal text-zinc-400">THB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Grid: Specifications & Stock Balances */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Specifications */}
              <div
                className={`lg:col-span-1 p-6 rounded-[14px] border flex flex-col gap-4 ${
                  isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
                }`}
              >
                <h3 className="text-[15px] font-bold flex items-center gap-2">
                  <Tag size={16} className="text-[#2EC4B6]" />
                  <span>{isThai ? "ข้อมูลสเปกสินค้า" : "Specifications"}</span>
                </h3>

                <div className="flex flex-col gap-2.5 text-[12.5px] divide-y divide-zinc-200 dark:divide-white/5">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "แบรนด์ / ผู้ผลิต" : "Brand"}</span>
                    <span className="font-medium">{product.brand?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "หมวดหมู่หลัก" : "Category"}</span>
                    <span className="font-medium">{product.category?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "หน่วยนับหลัก" : "Base Unit"}</span>
                    <span className="font-mono font-medium">{product.baseUnit?.code} ({product.baseUnit?.name})</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "วิธีติดตามสินค้า" : "Tracking Method"}</span>
                    <span className="font-mono font-semibold uppercase text-teal-400">{product.trackingMethod}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "กลยุทธ์การหยิบ" : "Picking Strategy"}</span>
                    <span className="font-mono font-medium">{product.pickingStrategy}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">{isThai ? "สถานะการใช้งาน" : "Status"}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 size={13} /> Active
                    </span>
                  </div>
                </div>

                {/* Barcodes list */}
                <div className="mt-2 pt-3 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-zinc-400">
                    {isThai ? "บาร์โค้ดที่ลงทะเบียน" : "Registered Barcodes"}
                  </span>
                  {barcodes.length === 0 ? (
                    <span className="text-[12px] text-zinc-500">-</span>
                  ) : (
                    barcodes.map((b, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg border font-mono text-[12px] ${
                          isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <BarcodeIcon size={14} className="text-zinc-400" />
                          <span>{b.barcode}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                          {b.barcodeType}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Stock Balances by Warehouse / Location */}
              <div
                className={`lg:col-span-2 p-6 rounded-[14px] border flex flex-col gap-4 ${
                  isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold flex items-center gap-2">
                    <Building2 size={16} className="text-[#2EC4B6]" />
                    <span>{isThai ? "พิกัดจัดเก็บและยอดสต็อกตามสาขา" : "Stock by Facility & Bins"}</span>
                  </h3>
                  <span className="text-[12px] text-zinc-400 font-mono">
                    {productBalances.length} Locations
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/10">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className={isLight ? "bg-slate-100 text-slate-700" : "bg-black/30 text-zinc-300"}>
                      <tr className="border-b border-zinc-200 dark:border-white/10">
                        <th className="py-2.5 px-4">{isThai ? "คลังสินค้า / สาขา" : "Facility"}</th>
                        <th className="py-2.5 px-4">{isThai ? "พิกัดจัดเก็บ (Bin)" : "Location Bin"}</th>
                        <th className="py-2.5 px-4">{isThai ? "สถานะสต็อก" : "Status"}</th>
                        <th className="py-2.5 px-4 text-right">{isThai ? "จำนวนคงเหลือ" : "Quantity"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                      {productBalances.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-zinc-400">
                            {isThai ? "ยังไม่มีการบันทึกยอดสต็อกในคลัง" : "No stock balances recorded"}
                          </td>
                        </tr>
                      ) : (
                        productBalances.map((b) => (
                          <tr key={b.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-medium">
                              <div>{b.facilityName || b.facilityCode}</div>
                              <div className="text-[11px] font-mono text-zinc-400">{b.facilityCode}</div>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-teal-400">
                              {b.locationCode || "STG-01"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                {b.stockStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[13.5px]">
                              {parseFloat(b.quantity).toLocaleString()}{" "}
                              <span className="text-[11px] font-normal text-zinc-400">
                                {product.baseUnit?.code}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WarehousePageTemplate>
  );
}
