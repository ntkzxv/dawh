"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { useRouter } from "next/navigation";
import {
  CustomDropdown,
  DropdownOption,
  Pagination,
  DataTable,
  DataTableColumn,
} from "@/components/common";
import {
  listProducts,
  createProduct,
  createProductBarcode,
} from "@/lib/api/products";
import { listStockBalances } from "@/lib/api/stock";
import { listFacilities, productReferenceApi } from "@/lib/api/master-data";
import type { Product, TrackingMethod, PickingStrategy } from "@/lib/products/types";
import type { StockBalance } from "@/lib/stock/types";
import type { Facility } from "@/lib/facilities/types";
import type { ProductCategoryDto } from "@/lib/product-categories/types";
import type { UnitOfMeasureDto } from "@/lib/units-of-measure/types";
import type { BrandDto } from "@/lib/brands/types";
import {
  ChevronDown,
  UploadCloud,
  Download,
  Plus,
  X,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Barcode as BarcodeIcon,
  MapPin,
  Search,
  MoreHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Package,
  Calendar,
  DollarSign,
  Tag,
  Boxes,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StockLocationItem {
  bin: string;
  zone: string;
  qty: number;
  isPrimary?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  nameTh: string;
  nameEn: string;
  categoryTh: string;
  categoryEn: string;
  categoryId?: string;
  brand: string;
  brandId?: string;
  onHand: number;
  reserved: number;
  quarantine: number;
  damaged: number;
  safetyStock: number;
  reorderPoint: number;
  stockUnit: string;
  secondaryUnit?: string;
  conversionRate?: string;
  trackingMethod: "none" | "lot" | "serial";
  lotNumber?: string;
  expiryDate?: string;
  updatedAt?: string;
  location: string;
  locationDetail: string;
  locationsList: StockLocationItem[];
  priceThb: number;
  descriptionTh: string;
  descriptionEn: string;
  imageUrl: string;
  historyBars: Array<{ label: string; value: number; color: string; heightPct: number }>;
}

function getCategoryPhoto(categoryName?: string | null): string {
  const c = (categoryName || "").toLowerCase();
  if (c.includes("elect") || c.includes("อิเล็ก") || c.includes("ไฟ")) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";
  }
  if (c.includes("food") || c.includes("อาหาร") || c.includes("บริโภค")) {
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
  }
  if (c.includes("office") || c.includes("สำนักงาน") || c.includes("เครื่องเขียน")) {
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";
  }
  return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80";
}

export default function WarehouseSplitLayoutView() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Data fetching state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Database entities
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [rawBalances, setRawBalances] = useState<StockBalance[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<ProductCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitOfMeasureDto[]>([]);
  const [brands, setBrands] = useState<BrandDto[]>([]);

  // Filter & UI state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState("");
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalItems, setServerTotalItems] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element | null;
      if (
        (filterDropdownRef.current && filterDropdownRef.current.contains(target as Node)) ||
        target?.closest?.('[role="listbox"]')
      ) {
        return;
      }
      setIsFilterDropdownOpen(false);
    }
    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // New Product Form state
  const [newSku, setNewSku] = useState("");
  const [newNameTh, setNewNameTh] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newBrandId, setNewBrandId] = useState("");
  const [newBaseUnitId, setNewBaseUnitId] = useState("");
  const [newTrackingMethod, setNewTrackingMethod] = useState<TrackingMethod>("NONE");
  const [newPickingStrategy, setNewPickingStrategy] = useState<PickingStrategy>("FIFO");
  const [newStandardCost, setNewStandardCost] = useState("0.00");
  const [newBarcode, setNewBarcode] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Load live products for the current page & filters
  const fetchProductsPage = useCallback(
    async (page: number, search: string, category: string, isSilent = false) => {
      if (!isSilent) setIsTableLoading(true);
      try {
        const queryParts: string[] = [`limit=${pageSize}`, `page=${page}`];
        if (search) {
          queryParts.push(`search=${encodeURIComponent(search)}`);
        }
        if (category && category !== "all") {
          queryParts.push(`categoryId=${encodeURIComponent(category)}`);
        }
        const queryString = `?${queryParts.join("&")}`;
        const pRes = await listProducts(queryString);

        if (Array.isArray(pRes?.data)) {
          setRawProducts(pRes.data as Product[]);
          if (typeof pRes.page?.total === "number") {
            setServerTotalItems(pRes.page.total);
          } else {
            setServerTotalItems(pRes.data.length);
          }
        }
      } catch (err) {
        console.error("Failed to load products page:", err);
        setApiError(err instanceof Error ? err.message : "Failed to load products.");
      } finally {
        setIsTableLoading(false);
      }
    },
    [pageSize]
  );

  // Initial load for metadata and master data (balances, facilities, categories, units, brands)
  const fetchMasterData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [pRes, bRes, fRes, cRes, uRes, brRes] = await Promise.allSettled([
        listProducts(`?limit=${pageSize}&page=1`),
        listStockBalances("?limit=200"),
        listFacilities("?limit=50"),
        productReferenceApi.listCategories(),
        productReferenceApi.listUnits(),
        productReferenceApi.listBrands(),
      ]);

      let hasSuccess = false;

      if (pRes.status === "fulfilled" && Array.isArray(pRes.value?.data)) {
        setRawProducts(pRes.value.data as Product[]);
        if (typeof pRes.value.page?.total === "number") {
          setServerTotalItems(pRes.value.page.total);
        } else {
          setServerTotalItems(pRes.value.data.length);
        }
        hasSuccess = true;
      }
      if (bRes.status === "fulfilled" && Array.isArray(bRes.value?.data)) {
        setRawBalances(bRes.value.data as StockBalance[]);
        hasSuccess = true;
      }
      if (fRes.status === "fulfilled" && Array.isArray(fRes.value?.data)) {
        setFacilities(fRes.value.data as Facility[]);
      }
      if (cRes.status === "fulfilled" && Array.isArray(cRes.value?.data)) {
        setCategories(cRes.value.data as ProductCategoryDto[]);
      }
      if (uRes.status === "fulfilled" && Array.isArray(uRes.value?.data)) {
        setUnits(uRes.value.data as UnitOfMeasureDto[]);
        if (!newBaseUnitId && (uRes.value.data as UnitOfMeasureDto[])[0]?.id) {
          setNewBaseUnitId((uRes.value.data as UnitOfMeasureDto[])[0].id);
        }
      }
      if (brRes.status === "fulfilled" && Array.isArray(brRes.value?.data)) {
        setBrands(brRes.value.data as BrandDto[]);
      }

      setIsLiveConnected(hasSuccess);

      if (pRes.status === "rejected") {
        const reason = (pRes as PromiseRejectedResult).reason;
        setApiError(
          reason?.message || "ไม่สามารถโหลดข้อมูลสินค้าได้ (โปรดตรวจสอบการเข้าสู่ระบบ)"
        );
      } else if (bRes.status === "rejected") {
        const reason = (bRes as PromiseRejectedResult).reason;
        setApiError(
          reason?.message || "ไม่สามารถโหลดข้อมูลสต็อกได้ (โปรดตรวจสอบการเชื่อมต่อ)"
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to backend API";
      setApiError(msg);
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [newBaseUnitId, pageSize]);

  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    await Promise.all([
      fetchMasterData(),
      fetchProductsPage(currentPage, debouncedSearch, categoryFilter, true),
    ]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchMasterData, fetchProductsPage, currentPage, debouncedSearch, categoryFilter]);

  // Initial load
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // When page, debounced search, or category filter changes, fetch server-side page
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchProductsPage(currentPage, debouncedSearch, categoryFilter);
  }, [currentPage, debouncedSearch, categoryFilter, fetchProductsPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, warehouseFilter]);

  // Transform raw Products + StockBalances into unified InventoryItem records
  const items: InventoryItem[] = useMemo(() => {
    return rawProducts.map((p) => {
      // Find balances for this product
      let matchingBalances = rawBalances.filter(
        (b) => b.productId === p.id || b.sku === p.sku
      );

      // If warehouse filter is specific, restrict balances
      if (warehouseFilter !== "all") {
        matchingBalances = matchingBalances.filter(
          (b) => b.facilityId === warehouseFilter || b.facilityCode === warehouseFilter
        );
      }

      // Calculate on-hand quantity
      const onHand = matchingBalances.reduce(
        (sum, b) => sum + (parseFloat(b.quantity) || 0),
        0
      );

      // Storage locations
      const locationsList: StockLocationItem[] =
        matchingBalances.length > 0
          ? matchingBalances.map((b, i) => ({
              bin: b.locationCode || "STG-01",
              zone: b.facilityName ? `${b.facilityName} (${b.facilityCode})` : b.facilityCode,
              qty: parseFloat(b.quantity) || 0,
              isPrimary: i === 0,
            }))
          : [
              {
                bin: "-",
                zone: isThai ? "ยังไม่มีการจัดเก็บในคลัง" : "No stock stored",
                qty: 0,
                isPrimary: true,
              },
            ];

      const primaryLocation = locationsList[0]?.bin || "-";
      const locationDetail = `${locationsList[0]?.zone || "-"} / ${primaryLocation}`;

      const primaryBarcode =
        p.barcodes?.find((b) => b.isPrimary)?.barcode ||
        p.barcodes?.[0]?.barcode ||
        "-";

      const priceThb = parseFloat(p.standardCost || "0");
      const trackingMethod = (p.trackingMethod?.toLowerCase() || "none") as
        | "none"
        | "lot"
        | "serial";

      // Expiry / lot from first balance with tracking
      const lotBalance = matchingBalances.find((b) => b.lotNumber);
      const lotNumber = lotBalance?.lotNumber || undefined;
      const expiryDate = lotBalance?.expiryDate ? lotBalance.expiryDate.split("T")[0] : undefined;

      // History bars simulated or mapped
      const historyBars = [
        { label: "10", value: 10, color: "#2EC4B6", heightPct: 40 },
        { label: "18", value: 18, color: "#2EC4B6", heightPct: 65 },
        { label: "20", value: 20, color: "#2EC4B6", heightPct: 75 },
        { label: "15", value: 15, color: "#2EC4B6", heightPct: 60 },
        {
          label: String(Math.round(onHand)),
          value: Math.round(onHand),
          color: onHand <= 5 ? "#E71D36" : "#2EC4B6",
          heightPct: Math.min(100, Math.max(20, (onHand / 50) * 100)),
        },
      ];

      return {
        id: p.id,
        sku: p.sku,
        barcode: primaryBarcode,
        nameTh: p.nameTh,
        nameEn: p.nameEn || p.nameTh,
        categoryTh: p.category?.name || (isThai ? "ทั่วไป" : "General"),
        categoryEn: p.category?.name || "General",
        categoryId: p.category?.id,
        brand: p.brand?.name || "-",
        brandId: p.brand?.id,
        onHand,
        reserved: 0,
        quarantine: 0,
        damaged: 0,
        safetyStock: 10,
        reorderPoint: 15,
        stockUnit: p.baseUnit?.code || "EA",
        secondaryUnit: p.units?.[0]?.unitCode,
        conversionRate: p.units?.[0]
          ? `1 ${p.units[0].unitCode} = ${p.units[0].baseQuantity} ${p.baseUnit.code}`
          : undefined,
        trackingMethod,
        lotNumber,
        expiryDate,
        updatedAt: p.updatedAt ? p.updatedAt.split("T")[0] : "-",
        location: primaryLocation,
        locationDetail,
        locationsList,
        priceThb,
        descriptionTh: p.description || "-",
        descriptionEn: p.description || "-",
        imageUrl: getCategoryPhoto(p.category?.name),
        historyBars,
      };
    });
  }, [rawProducts, rawBalances, warehouseFilter, isThai]);

  // Dropdown options
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: "all", label: isThai ? "ทุกหมวดหมู่" : "All Categories" },
    ];
    if (categories.length > 0) {
      categories.forEach((cat) => {
        list.push({ value: cat.id, label: cat.name });
      });
    } else {
      const distinctNames = Array.from(new Set(items.map((i) => i.categoryTh)));
      distinctNames.forEach((name) => {
        list.push({ value: name, label: name });
      });
    }
    return list;
  }, [categories, items, isThai]);

  const warehouseOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: "all", label: isThai ? "ทุกคลังสินค้า" : "All Warehouses" },
    ];
    if (facilities.length > 0) {
      facilities.forEach((f) => {
        list.push({
          value: f.id,
          label: `${f.code} - ${f.name}`,
          subLabel: f.facilityType,
        });
      });
    } else {
      list.push(
        { value: "HQ-01", label: "HQ-01 - สำนักงานใหญ่ (Headquarter)" },
        { value: "BKK-01", label: "BKK-01 - สาขากรุงเทพฯ (Bangkok Branch)" },
        { value: "CNX-01", label: "CNX-01 - สาขาเชียงใหม่ (Chiang Mai Branch)" }
      );
    }
    return list;
  }, [facilities, isThai]);

  const activeWarehouseOption = warehouseOptions.find((o) => o.value === warehouseFilter);
  const activeCategoryOption = categoryOptions.find((o) => o.value === categoryFilter);
  const activeFilterCount =
    (warehouseFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  const filterSummaryText = useMemo(() => {
    const isWhActive = warehouseFilter !== "all";
    const isCatActive = categoryFilter !== "all";

    if (!isWhActive && !isCatActive) {
      return isThai ? "ตัวกรอง: ทั้งหมด" : "Filter: All";
    }
    if (isWhActive && !isCatActive) {
      const label =
        activeWarehouseOption?.label.split(" - ")[0] ||
        activeWarehouseOption?.label ||
        "";
      return isThai ? `คลัง: ${label}` : `Wh: ${label}`;
    }
    if (!isWhActive && isCatActive) {
      return isThai
        ? `หมวด: ${activeCategoryOption?.label || ""}`
        : `Cat: ${activeCategoryOption?.label || ""}`;
    }
    const whShort = activeWarehouseOption?.label.split(" - ")[0] || "Wh";
    return `${whShort} · ${activeCategoryOption?.label || ""}`;
  }, [warehouseFilter, categoryFilter, activeWarehouseOption, activeCategoryOption, isThai]);

  // Options filtered by search within filter dropdown
  const searchedWarehouseOptions = useMemo(() => {
    if (!filterSearchQuery.trim()) return warehouseOptions;
    const q = filterSearchQuery.toLowerCase().trim();
    return warehouseOptions.filter(
      (opt) =>
        opt.value === "all" ||
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [warehouseOptions, filterSearchQuery]);

  const searchedCategoryOptions = useMemo(() => {
    if (!filterSearchQuery.trim()) return categoryOptions;
    const q = filterSearchQuery.toLowerCase().trim();
    return categoryOptions.filter(
      (opt) => opt.value === "all" || opt.label.toLowerCase().includes(q)
    );
  }, [categoryOptions, filterSearchQuery]);

  // Filtered Items by Search & Category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (categoryFilter !== "all") {
        if (item.categoryId && item.categoryId === categoryFilter) {
          // match
        } else if (
          item.categoryTh === categoryFilter ||
          item.categoryEn === categoryFilter
        ) {
          // match
        } else {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchNameTh = item.nameTh.toLowerCase().includes(q);
        const matchNameEn = item.nameEn.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchLocation = item.location.toLowerCase().includes(q);
        const matchBarcode = item.barcode.toLowerCase().includes(q);
        if (
          !matchSku &&
          !matchNameTh &&
          !matchNameEn &&
          !matchBrand &&
          !matchLocation &&
          !matchBarcode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [items, categoryFilter, searchQuery]);

  // Reset to first page whenever search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, warehouseFilter, categoryFilter]);

  const totalItems = isLiveConnected ? serverTotalItems : filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    if (isLiveConnected) {
      return items;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [isLiveConnected, items, filteredItems, currentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "SKU",
      "Name (TH)",
      "Name (EN)",
      "Category",
      "Brand",
      "On Hand",
      "Unit",
      "Unit Cost (THB)",
      "Total Valuation (THB)",
      "Primary Location",
      "Tracking Method",
      "Updated Date",
    ];

    const rows = filteredItems.map((item) => [
      `"${item.sku}"`,
      `"${item.nameTh.replace(/"/g, '""')}"`,
      `"${item.nameEn.replace(/"/g, '""')}"`,
      `"${item.categoryTh}"`,
      `"${item.brand}"`,
      item.onHand,
      `"${item.stockUnit}"`,
      item.priceThb,
      item.onHand * item.priceThb,
      `"${item.location}"`,
      `"${item.trackingMethod.toUpperCase()}"`,
      `"${item.updatedAt || ""}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `dawh_inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add Product Form Submit
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!newSku.trim()) {
      setFormError(isThai ? "กรุณากรอกรหัสสินค้า SKU" : "SKU is required");
      return;
    }
    if (!newNameTh.trim()) {
      setFormError(isThai ? "กรุณากรอกชื่อสินค้าภาษาไทย" : "Thai name is required");
      return;
    }
    if (!newBaseUnitId) {
      setFormError(isThai ? "กรุณาเลือกหน่วยนับหลัก" : "Base unit is required");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        sku: newSku.trim().toUpperCase(),
        nameTh: newNameTh.trim(),
        nameEn: newNameEn.trim() || null,
        description: newDescription.trim() || null,
        categoryId: newCategoryId || null,
        brandId: newBrandId || null,
        baseUnitId: newBaseUnitId,
        trackingMethod: newTrackingMethod,
        pickingStrategy: newPickingStrategy,
        weightKg: null,
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        standardCost: parseFloat(newStandardCost) >= 0 ? newStandardCost : "0.00",
        currencyCode: "THB",
        shelfLifeDays: newTrackingMethod === "LOT" ? 365 : null,
        storageCondition: null,
        isActive: true,
      };

      const res = await createProduct(payload);
      const createdProd = res.data as Product;
      let barcodeSaveError: string | null = null;

      // If barcode provided, register barcode
      if (newBarcode.trim() && createdProd?.id) {
        try {
          await createProductBarcode(createdProd.id, {
            barcode: newBarcode.trim(),
            barcodeType: "CODE_128",
            isPrimary: true,
          });
        } catch (bErr) {
          console.warn("Could not save initial barcode:", bErr);
          barcodeSaveError =
            bErr instanceof Error
              ? bErr.message
              : isThai
              ? "ไม่สามารถบันทึกบาร์โค้ดเริ่มต้นได้"
              : "The initial barcode could not be saved.";
        }
      }

      if (barcodeSaveError) {
        setFormError(
          isThai
            ? `สร้างสินค้าแล้ว แต่บันทึกบาร์โค้ดไม่สำเร็จ: ${barcodeSaveError}`
            : `Product created, but the barcode could not be saved: ${barcodeSaveError}`
        );
      }
      setFormSuccess(true);
      setTimeout(async () => {
        setIsAddModalOpen(false);
        setFormSuccess(false);
        // Reset inputs
        setNewSku("");
        setNewNameTh("");
        setNewNameEn("");
        setNewDescription("");
        setNewBarcode("");
        setNewStandardCost("0.00");
        // Reload table
        await fetchAllData(true);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-col lg:flex-row items-start justify-start p-0 min-h-0 self-stretch flex-1 ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#F8FAFC]"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* ========================================================= */}
      {/* 📌 [LEFT PANE]: Auto layout padding: 24px sm: 32px        */}
      {/* ========================================================= */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-5 self-stretch">
        {/* Status banner if live connected or error */}
        {apiError && (
          <div
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-[13px] ${
              isLight
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-amber-500/10 border-amber-500/20 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-500" />
              <span>
                {isThai
                  ? "ไม่สามารถโหลดข้อมูลจากระบบได้: "
                  : "Unable to load live product data: "}
                {apiError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchAllData(false)}
              className="font-medium underline hover:opacity-80 cursor-pointer ml-3 shrink-0"
            >
              {isThai ? "ลองเชื่อมต่อใหม่" : "Retry"}
            </button>
          </div>
        )}

        {/* filter-bar & search */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* search & filters: Search input, Category, Warehouse */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div
              className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-2.5 h-[38px] rounded-[8px] border text-[13px] w-full sm:w-[260px] md:w-[320px] transition-colors ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] focus-within:border-slate-900 shadow-xs"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] focus-within:border-white"
              }`}
            >
              <Search size={15} className="text-[#A1A1AA] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isThai
                    ? "ค้นหา SKU, ชื่อสินค้า, หมวดหมู่, พิกัด..."
                    : "Search SKU, Name, Category, Bin..."
                }
                className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Unified 1-Dropdown Filter (คลังสินค้า + หมวดหมู่) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-2 h-[38px] rounded-[8px] border text-[13px] transition-colors cursor-pointer select-none outline-none ${
                  activeFilterCount > 0
                    ? isLight
                      ? "bg-slate-100 border-slate-900 text-slate-900 font-medium shadow-xs"
                      : "bg-[#444444] border-white text-white font-medium shadow-xs"
                    : isLight
                    ? "bg-white border-[#E4E4E7] text-[#222222] hover:border-slate-400 shadow-xs"
                    : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:border-[#666666]"
                }`}
              >
                <Filter
                  size={14}
                  className={`shrink-0 ${
                    activeFilterCount > 0
                      ? isLight ? "text-black" : "text-white"
                      : isLight ? "text-slate-600" : "text-[#A1A1AA]"
                  }`}
                />
                <span className="whitespace-nowrap max-w-[210px] truncate text-[13px]">
                  {filterSummaryText}
                </span>

                {activeFilterCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                    isLight ? "bg-slate-900 text-white" : "bg-white text-black"
                  }`}>
                    {activeFilterCount}
                  </span>
                )}

                {activeFilterCount > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setWarehouseFilter("all");
                      setCategoryFilter("all");
                    }}
                    title={isThai ? "ล้างตัวกรอง" : "Reset filters"}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors ml-0.5"
                  >
                    <X size={12} />
                  </span>
                )}

                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform duration-200 ${
                    activeFilterCount > 0
                      ? isLight ? "text-black" : "text-white"
                      : "text-[#A1A1AA]"
                  } ${isFilterDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Popover */}
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-full left-0 mt-1.5 z-40 w-[310px] sm:w-[350px] rounded-[12px] border shadow-2xl p-4 flex flex-col gap-3.5 ${
                      isLight
                        ? "bg-white border-slate-300 text-black shadow-lg"
                        : "bg-[#282828] border-[#4A4A4A] text-white shadow-2xl"
                    }`}
                  >
                    {/* Header */}
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isLight ? "border-slate-200" : "border-white/10"
                    }`}>
                      <div className="flex items-center gap-1.5 text-[12.5px] font-bold">
                        <Filter size={13} className={isLight ? "text-black" : "text-white"} />
                        <span>{isThai ? "ตัวกรองสินค้า" : "Filter Products"}</span>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setWarehouseFilter("all");
                            setCategoryFilter("all");
                            setFilterSearchQuery("");
                          }}
                          className={`text-[11.5px] font-medium hover:underline cursor-pointer ${
                            isLight ? "text-slate-900" : "text-white"
                          }`}
                        >
                          {isThai ? "ล้างตัวกรองทั้งหมด" : "Clear all"}
                        </button>
                      )}
                    </div>

                    {/* Search Input inside Filter */}
                    <div
                      className={`flex items-center px-3 py-1.5 gap-2 rounded-lg border text-[12.5px] transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus-within:border-black text-black"
                          : "bg-[#1E1E1E] border-[#444444] focus-within:border-white text-white"
                      }`}
                    >
                      <Search size={14} className={isLight ? "text-slate-500" : "text-zinc-400"} />
                      <input
                        type="text"
                        value={filterSearchQuery}
                        onChange={(e) => setFilterSearchQuery(e.target.value)}
                        placeholder={
                          isThai
                            ? "ค้นหาคลัง หรือ หมวดหมู่..."
                            : "Search facility or category..."
                        }
                        className={`w-full bg-transparent border-none outline-none text-[12.5px] ${
                          isLight ? "placeholder:text-slate-400 text-black" : "placeholder:text-zinc-500 text-white"
                        }`}
                      />
                      {filterSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setFilterSearchQuery("")}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown 1: Warehouse */}
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400">
                        <Building2 size={13} className={isLight ? "text-black" : "text-white"} />
                        <span>{isThai ? "คลังสินค้า / สาขา (Warehouse)" : "Warehouse / Facility"}</span>
                      </label>
                      <CustomDropdown
                        value={warehouseFilter}
                        onChange={(val) => setWarehouseFilter(val)}
                        options={searchedWarehouseOptions}
                        placeholder={isThai ? "เลือกคลังสินค้า..." : "Select Facility..."}
                        size="sm"
                        className="w-full"
                        triggerClassName={`w-full h-[36px] rounded-lg border text-[12.5px] font-medium transition-colors ${
                          warehouseFilter !== "all"
                            ? isLight
                              ? "bg-slate-100 border-black text-black"
                              : "bg-[#383838] border-white text-white"
                            : isLight
                            ? "bg-white border-slate-300 hover:border-black text-black"
                            : "bg-[#1E1E1E] border-[#444444] hover:border-white text-white"
                        }`}
                      />
                    </div>

                    {/* Dropdown 2: Category */}
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400">
                        <Tag size={13} className={isLight ? "text-black" : "text-white"} />
                        <span>{isThai ? "หมวดหมู่สินค้า (Category)" : "Product Category"}</span>
                      </label>
                      <CustomDropdown
                        value={categoryFilter}
                        onChange={(val) => setCategoryFilter(val)}
                        options={searchedCategoryOptions}
                        placeholder={isThai ? "เลือกหมวดหมู่..." : "Select Category..."}
                        size="sm"
                        className="w-full"
                        triggerClassName={`w-full h-[36px] rounded-lg border text-[12.5px] font-medium transition-colors ${
                          categoryFilter !== "all"
                            ? isLight
                              ? "bg-slate-100 border-black text-black"
                              : "bg-[#383838] border-white text-white"
                            : isLight
                            ? "bg-white border-slate-300 hover:border-black text-black"
                            : "bg-[#1E1E1E] border-[#444444] hover:border-white text-white"
                        }`}
                      />
                    </div>

                    {/* Quick Filter Search Results (if search input has text) */}
                    {filterSearchQuery && (
                      <div className={`flex flex-col gap-1 pt-1 border-t ${
                        isLight ? "border-slate-200" : "border-white/10"
                      }`}>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {isThai ? "ผลลัพธ์ที่ค้นพบ:" : "Matching items:"}
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-[90px] overflow-y-auto">
                          {searchedWarehouseOptions
                            .filter((o) => o.value !== "all")
                            .map((opt) => (
                              <button
                                key={`wh-${opt.value}`}
                                type="button"
                                onClick={() => setWarehouseFilter(opt.value)}
                                className={`px-2 py-0.5 rounded text-[11.5px] border flex items-center gap-1 cursor-pointer transition-colors ${
                                  warehouseFilter === opt.value
                                    ? isLight
                                      ? "bg-black text-white border-black font-medium"
                                      : "bg-white text-black border-white font-medium"
                                    : isLight
                                    ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                                    : "bg-[#1E1E1E] border-white/10 text-zinc-300 hover:bg-white/10"
                                }`}
                              >
                                <Building2 size={10} />
                                <span>{opt.label.split(" - ")[0]}</span>
                              </button>
                            ))}
                          {searchedCategoryOptions
                            .filter((o) => o.value !== "all")
                            .map((opt) => (
                              <button
                                key={`cat-${opt.value}`}
                                type="button"
                                onClick={() => setCategoryFilter(opt.value)}
                                className={`px-2 py-0.5 rounded text-[11.5px] border flex items-center gap-1 cursor-pointer transition-colors ${
                                  categoryFilter === opt.value
                                    ? isLight
                                      ? "bg-black text-white border-black font-medium"
                                      : "bg-white text-black border-white font-medium"
                                    : isLight
                                    ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                                    : "bg-[#1E1E1E] border-white/10 text-zinc-300 hover:bg-white/10"
                                }`}
                              >
                                <Tag size={10} />
                                <span>{opt.label}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Done */}
                    <div className={`pt-2 border-t flex items-center ${
                      activeFilterCount > 0 ? "justify-between" : "justify-end"
                    } ${
                      isLight ? "border-slate-200" : "border-white/10"
                    }`}>
                      {activeFilterCount > 0 && (
                        <span className="text-[11.5px] text-zinc-400 font-mono">
                          {isThai
                            ? `เลือก ${activeFilterCount} ตัวกรอง`
                            : `${activeFilterCount} active`}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen(false)}
                        className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-semibold cursor-pointer transition-colors ${
                          isLight
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "bg-white text-black hover:bg-zinc-200"
                        }`}
                      >
                        {isThai ? "เสร็จสิ้น" : "Done"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Refresh Live Data Button */}
            <button
              type="button"
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              title={isThai ? "รีเฟรชข้อมูลล่าสุดจากฐานข้อมูล" : "Refresh from database"}
              className={`h-[38px] w-[38px] flex items-center justify-center rounded-[8px] border text-[13px] transition-colors cursor-pointer outline-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-teal-400" : ""}
              />
            </button>
          </div>

          {/* actions: Export, Import, Add Product */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* btn-export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className={`box-border flex flex-row items-center px-4 py-2 gap-1.5 h-[38px] rounded-[8px] border text-[13px] font-normal transition-colors cursor-pointer outline-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
              title={isThai ? "ดาวน์โหลดรายการเป็นไฟล์ CSV" : "Export CSV"}
            >
              <UploadCloud
                size={14}
                className={`shrink-0 ${isLight ? "text-slate-700" : "text-[#F8FAFC]"}`}
              />
              <span>{isThai ? "ส่งออก" : "Export"}</span>
            </button>

            {/* btn-import */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className={`box-border flex flex-row items-center px-4 py-2 gap-1.5 h-[38px] rounded-[8px] border text-[13px] font-normal transition-colors cursor-pointer outline-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <Download
                size={14}
                className={`shrink-0 ${isLight ? "text-slate-700" : "text-[#F8FAFC]"}`}
              />
              <span>{isThai ? "นำเข้า" : "Import"}</span>
            </button>

            {/* btn-add (Theme-adaptive Black/White Primary CTA) */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className={`flex flex-row items-center px-4 py-2 gap-1.5 h-[38px] rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer outline-none shadow-xs ${
                isLight
                  ? "bg-slate-900 hover:bg-black text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
              }`}
            >
              <Plus
                size={14}
                className={`shrink-0 ${isLight ? "text-white" : "text-black"}`}
              />
              <span>{isThai ? "เพิ่มสินค้า" : "Add Product"}</span>
            </button>
          </div>
        </div>

        {/* inventory-table: Product Master & SKU Catalog using shared DataTable component */}
        <DataTable<InventoryItem>
          data={paginatedItems}
          keyExtractor={(item) => item.id}
          isLoading={isLoading || isTableLoading}
          selectedKey={selectedItem?.id}
          onRowClick={(item) => setSelectedItem(item)}
          minWidth="940px"
          emptyTitle={
            isThai
              ? "ไม่พบสินค้าตามเงื่อนไขการค้นหา"
              : "No products matching your filters"
          }
          emptyAction={
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setWarehouseFilter("all");
              }}
              className="mt-1 text-[12.5px] text-[#2EC4B6] hover:underline cursor-pointer"
            >
              {isThai ? "ล้างตัวกรองทั้งหมด" : "Clear all filters"}
            </button>
          }
          columns={[
            {
              key: "sku",
              header: isThai ? "รหัสสินค้า & SKU" : "SKU & Product",
              render: (item) => (
                <div>
                  <div
                    className={`font-mono font-semibold text-[12.5px] ${
                      isLight ? "text-slate-800" : "text-zinc-200"
                    }`}
                  >
                    {item.sku}
                  </div>
                  <div
                    className={`font-medium text-[13.5px] line-clamp-1 max-w-[280px] ${
                      isLight ? "text-slate-900" : "text-white/90"
                    }`}
                  >
                    {isThai ? item.nameTh : item.nameEn}
                  </div>
                  <div
                    className={`text-[11px] ${
                      isLight ? "text-slate-500" : "text-zinc-500"
                    }`}
                  >
                    {item.brand}
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: isThai ? "หมวดหมู่" : "Category",
              render: (item) => (
                <span
                  className={`text-[12.5px] ${
                    isLight ? "text-slate-600" : "text-zinc-400"
                  }`}
                >
                  {isThai ? item.categoryTh : item.categoryEn}
                </span>
              ),
            },
            {
              key: "onHand",
              header: isThai ? "คงเหลือในคลัง" : "Stock On Hand",
              align: "right",
              render: (item) => (
                <div className="font-mono font-bold text-[14px]">
                  <span
                    className={
                      item.onHand <= item.reorderPoint
                        ? "text-amber-500 font-semibold"
                        : isLight
                        ? "text-emerald-600 font-semibold"
                        : "text-emerald-400 font-semibold"
                    }
                  >
                    {item.onHand.toLocaleString()}
                  </span>{" "}
                  <span
                    className={`text-[11px] font-normal ${
                      isLight ? "text-slate-500" : "text-zinc-400"
                    }`}
                  >
                    {item.stockUnit}
                  </span>
                </div>
              ),
            },
            {
              key: "unit",
              header: isThai ? "หน่วยนับ" : "Unit",
              render: (item) => (
                <div>
                  <div
                    className={`text-[12px] font-medium ${
                      isLight ? "text-slate-800" : "text-white/90"
                    }`}
                  >
                    {item.stockUnit}
                  </div>
                  {item.secondaryUnit && (
                    <div
                      className={`text-[11px] ${
                        isLight ? "text-slate-500" : "text-zinc-500"
                      }`}
                    >
                      {item.secondaryUnit}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "location",
              header: isThai ? "ที่ตั้งหลัก" : "Location",
              render: (item) => (
                <span
                  className={`text-[12.5px] font-mono font-medium ${
                    isLight ? "text-slate-700" : "text-zinc-300"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {item.location}
                </span>
              ),
            },
            {
              key: "priceThb",
              header: isThai ? "ราคาต้นทุน" : "Cost (THB)",
              align: "right",
              render: (item) => (
                <span
                  className={`font-mono text-[12.5px] ${
                    isLight ? "text-slate-800" : "text-zinc-300"
                  }`}
                >
                  {item.priceThb > 0
                    ? item.priceThb.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })
                    : "-"}
                </span>
              ),
            },
            {
              key: "updatedAt",
              header: isThai ? "วันที่ปรับปรุง" : "Updated Date",
              render: (item) => (
                <span
                  className={`text-[12px] font-mono ${
                    isLight ? "text-slate-500" : "text-zinc-400"
                  }`}
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {item.updatedAt || "-"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "center",
              headerClassName: "w-12 pl-2 pr-4",
              className: "w-12 pl-2 pr-4",
              render: (item) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                  }}
                  title={isThai ? "ดูรายละเอียดเพิ่มเติม" : "View Details"}
                  className={`p-1 transition-colors inline-flex items-center justify-center cursor-pointer ${
                    isLight
                      ? "text-slate-400 hover:text-slate-900"
                      : "text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  <MoreHorizontal size={17} />
                </button>
              ),
            },
          ]}
        />

        {/* Separated Pagination Bar (Outside Table) */}
        <div className="w-full flex justify-end">
          <Pagination
            mode="offset"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            showTotalItems={true}
            isThai={isThai}
            className="w-full py-1 text-xs"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📌 [DETAIL DRAWER]: Popup Overlay เด้งมาทับด้านข้าง ไม่บีบตาราง */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40"
            />

            {/* Floating Overlay Drawer Panel */}
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] h-full shadow-2xl flex flex-col p-6 gap-4 overflow-y-auto ${
                isLight
                  ? "bg-white border-l border-[#E4E4E7] text-[#222222]"
                  : "bg-[#383838] border-l border-[#444444] text-[#F8FAFC]"
              }`}
              style={{ boxSizing: "border-box" }}
            >
              {/* drawer-header: Close button */}
              <div className="w-full flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-[12px] font-mono text-[#A1A1AA]">
                  {isThai ? "รายละเอียดข้อมูลสินค้าหลัก" : "Product Master Details"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer outline-none p-1 rounded-md hover:bg-white/5"
                  title={isThai ? "ปิดแผงรายละเอียด" : "Close drawer"}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Square 1:1 Large Product Photo */}
              <div className="w-full aspect-square rounded-[10px] overflow-hidden relative shrink-0 bg-neutral-900 border border-white/10 shadow-inner">
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.nameTh}
                  fill
                  sizes="420px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* item-info: SKU, Name, Description */}
              <div className="w-full flex flex-col items-start gap-1.5">
                <div className="w-full flex items-center justify-between text-[11.5px] font-mono">
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    {selectedItem.sku}
                  </span>
                  <span className="text-[#A1A1AA] flex items-center gap-1">
                    <BarcodeIcon size={12} />
                    {selectedItem.barcode}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold leading-tight break-words">
                  <span className={isLight ? "text-[#222222]" : "text-[#F8FAFC]"}>
                    {isThai ? selectedItem.nameTh : selectedItem.nameEn}
                  </span>
                </h3>
                <p className="text-[12.5px] font-normal leading-[17px] text-[#A1A1AA]">
                  {isThai ? selectedItem.descriptionTh : selectedItem.descriptionEn}
                </p>
              </div>

              {/* 📌 Storage Bins Multi-Location (DESIGN.md 5 & 19.3) */}
              <div className="w-full flex flex-col gap-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                    {isThai ? "ตำแหน่งจัดเก็บตามพิกัด" : "Storage Locations"}
                  </span>
                  <span className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                    {selectedItem.locationsList.length} Bins
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[...selectedItem.locationsList]
                    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                    .map((loc, i) => {
                      const isHighlighted = loc.isPrimary ?? i === 0;
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-colors ${
                            isHighlighted
                              ? isLight
                                ? "bg-teal-500/10 border-[#2EC4B6]/50 shadow-sm"
                                : "bg-[#2EC4B6]/10 border-[#2EC4B6]/40 shadow-sm"
                              : isLight
                              ? "bg-slate-50 border-slate-200"
                              : "bg-black/20 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold ${
                                isHighlighted
                                  ? isLight
                                    ? "text-teal-900"
                                    : "text-white"
                                  : isLight
                                  ? "text-slate-700"
                                  : "text-white/80"
                              }`}
                            >
                              {loc.bin}
                            </span>
                            <span
                              className={`text-[11px] font-normal ${
                                isLight ? "text-slate-500" : "text-zinc-400"
                              }`}
                            >
                              {loc.zone}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isHighlighted
                                ? "text-[#2EC4B6]"
                                : isLight
                                ? "text-slate-900"
                                : "text-white"
                            }`}
                          >
                            {loc.qty.toLocaleString()} {selectedItem.stockUnit}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* specs: Lot, Unit Conversion & Valuation */}
              <div className="w-full flex flex-col items-start gap-2 text-[12.5px] pt-1">
                {/* Brand */}
                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "แบรนด์/ผู้ผลิต" : "Brand / Maker"}
                  </span>
                  <span
                    className={`font-medium text-right ${
                      isLight ? "text-slate-900" : "text-zinc-100"
                    }`}
                  >
                    {selectedItem.brand}
                  </span>
                </div>

                {/* Tracking Method */}
                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "ระบบการติดตาม" : "Tracking Method"}
                  </span>
                  <span
                    className={`font-medium text-right font-mono uppercase ${
                      isLight ? "text-slate-800" : "text-zinc-300"
                    }`}
                  >
                    {selectedItem.trackingMethod}
                  </span>
                </div>

                {/* Unit Conversion */}
                {selectedItem.conversionRate && (
                  <div className="w-full flex flex-row justify-between items-start">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "อัตราแปลงหน่วยนับ" : "Unit Conversion"}
                    </span>
                    <span
                      className={`font-medium text-right ${
                        isLight ? "text-slate-800" : "text-zinc-300"
                      }`}
                    >
                      {selectedItem.conversionRate}
                    </span>
                  </div>
                )}

                {/* Unit Price & Stock Valuation */}
                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "ราคาต้นทุนเฉลี่ย" : "Unit Cost"}
                  </span>
                  <span
                    className={`font-medium text-right font-mono ${
                      isLight ? "text-slate-900" : "text-zinc-100"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {selectedItem.priceThb.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    {isThai ? "บาท" : "THB"}
                  </span>
                </div>

                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "มูลค่าสต็อกรวม" : "Total Valuation"}
                  </span>
                  <span
                    className="font-bold text-right font-mono text-[#2EC4B6]"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {(selectedItem.onHand * selectedItem.priceThb).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    {isThai ? "บาท" : "THB"}
                  </span>
                </div>

                {/* Lot & Expiry */}
                {selectedItem.lotNumber && (
                  <div className="w-full flex flex-row justify-between items-start">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "ล็อตสินค้า / หมดอายุ" : "Lot / Expiry"}
                    </span>
                    <span
                      className={`font-medium text-right font-mono ${
                        isLight ? "text-slate-800" : "text-zinc-300"
                      }`}
                    >
                      {selectedItem.lotNumber}{" "}
                      {selectedItem.expiryDate ? `· ${selectedItem.expiryDate}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* drawer-actions: ปุ่มดูรายละเอียดเพิ่มเติม */}
              <div className="w-full flex flex-row items-center mt-auto pt-3">
                <button
                  type="button"
                  onClick={() => router.push(`/warehouse/inventory/${selectedItem.sku}`)}
                  className={`w-full h-[38px] box-border flex flex-row justify-center items-center px-4 py-2 gap-1.5 rounded-[6px] border text-[13px] font-medium transition-colors cursor-pointer outline-none ${
                    isLight
                      ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-[#333333] hover:border-white/20"
                  }`}
                  title={isThai ? "เปิดดูรายละเอียดสินค้าในหน้าเต็ม" : "Open product details page"}
                >
                  <ArrowUpRight
                    size={15}
                    className={`shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`}
                  />
                  <span>{isThai ? "ดูรายละเอียดเพิ่มเติม" : "More Details"}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 📌 [ADD PRODUCT MODAL]: Register New Product to Database  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative z-10 w-full max-w-[560px] rounded-[14px] border shadow-2xl p-6 overflow-hidden flex flex-col gap-4 max-h-[90vh] overflow-y-auto ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#323232] border-[#444444] text-white"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#2EC4B6]/15 text-[#2EC4B6]">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold">
                      {isThai ? "เพิ่มข้อมูลสินค้าใหม่" : "Register New Product"}
                    </h2>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                      {isThai ? "บันทึกข้อมูลสินค้าหลักลงฐานข้อมูลระบบ WMS" : "Create SKU master in database"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Feedback */}
              {formError && (
                <div className="p-3 rounded-lg text-[12.5px] bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg text-[12.5px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{isThai ? "บันทึกข้อมูลสินค้าสำเร็จแล้ว!" : "Product created successfully!"}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleCreateProductSubmit} className="flex flex-col gap-3.5 text-[13px]">
                {/* SKU & Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "รหัสสินค้า SKU *" : "SKU Code *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                      placeholder="e.g. ELEC-001"
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-[13px] outline-none transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                          : "bg-[#282828] border-[#444444] focus:border-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "บาร์โค้ดหลัก (Barcode)" : "Primary Barcode"}
                    </label>
                    <input
                      type="text"
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      placeholder="e.g. 885012300001"
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-[13px] outline-none transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                          : "bg-[#282828] border-[#444444] focus:border-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "ชื่อสินค้าภาษาไทย *" : "Thai Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newNameTh}
                      onChange={(e) => setNewNameTh(e.target.value)}
                      placeholder="e.g. โคมไฟฟลัดไลท์ 100W"
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                          : "bg-[#282828] border-[#444444] focus:border-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "ชื่อสินค้าภาษาอังกฤษ" : "English Name"}
                    </label>
                    <input
                      type="text"
                      value={newNameEn}
                      onChange={(e) => setNewNameEn(e.target.value)}
                      placeholder="e.g. LED Floodlight 100W"
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                          : "bg-[#282828] border-[#444444] focus:border-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Category & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "หมวดหมู่สินค้า" : "Category"}
                    </label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-[#282828] border-[#444444] text-white"
                      }`}
                    >
                      <option value="">{isThai ? "-- เลือกหมวดหมู่ --" : "-- Select Category --"}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "แบรนด์ / ผู้ผลิต" : "Brand"}
                    </label>
                    <select
                      value={newBrandId}
                      onChange={(e) => setNewBrandId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-[#282828] border-[#444444] text-white"
                      }`}
                    >
                      <option value="">{isThai ? "-- เลือกแบรนด์ --" : "-- Select Brand --"}</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Base Unit & Standard Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "หน่วยนับหลัก (Base Unit) *" : "Base Unit *"}
                    </label>
                    <select
                      required
                      value={newBaseUnitId}
                      onChange={(e) => setNewBaseUnitId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-[#282828] border-[#444444] text-white"
                      }`}
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} ({u.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "ราคาต้นทุนมาตรฐาน (THB)" : "Standard Cost (THB)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newStandardCost}
                      onChange={(e) => setNewStandardCost(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-[13px] outline-none transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                          : "bg-[#282828] border-[#444444] focus:border-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Tracking & Picking Strategy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "การติดตามสินค้า (Tracking Method)" : "Tracking Method"}
                    </label>
                    <select
                      value={newTrackingMethod}
                      onChange={(e) => setNewTrackingMethod(e.target.value as TrackingMethod)}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-[#282828] border-[#444444] text-white"
                      }`}
                    >
                      <option value="NONE">{isThai ? "NONE - สินค้าทั่วไป" : "NONE - General"}</option>
                      <option value="LOT">{isThai ? "LOT - ติดตามตามล็อต" : "LOT - Batch Tracking"}</option>
                      <option value="SERIAL">{isThai ? "SERIAL - ซีเรียลนัมเบอร์" : "SERIAL - Serialized"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                      {isThai ? "กลยุทธ์การหยิบ (Picking Strategy)" : "Picking Strategy"}
                    </label>
                    <select
                      value={newPickingStrategy}
                      onChange={(e) => setNewPickingStrategy(e.target.value as PickingStrategy)}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-300 text-slate-800"
                          : "bg-[#282828] border-[#444444] text-white"
                      }`}
                    >
                      <option value="FIFO">{isThai ? "FIFO - เข้าก่อนออกก่อน" : "FIFO - First In First Out"}</option>
                      <option value="FEFO" disabled={newTrackingMethod !== "LOT"}>
                        {isThai ? "FEFO - หมดอายุก่อนออกก่อน (สำหรับ LOT)" : "FEFO - First Expired First Out"}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[12px] font-medium mb-1 text-zinc-600 dark:text-zinc-300">
                    {isThai ? "คำอธิบาย / รายละเอียดเพิ่มเติม" : "Description"}
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={isThai ? "ระบุรายละเอียดสินค้า คุณสมบัติเฉพาะ..." : "Product specifications..."}
                    className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none transition-colors ${
                      isLight
                        ? "bg-slate-50 border-slate-300 focus:border-slate-900"
                        : "bg-[#282828] border-[#444444] focus:border-white"
                    }`}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-white/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg border text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {isThai ? "ยกเลิก" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-opacity ${
                      isLight ? "bg-slate-900 hover:bg-black text-white" : "bg-white hover:bg-zinc-200 text-black"
                    } ${formSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                    <span>{isThai ? "บันทึกลงฐานข้อมูล" : "Save to Database"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 📌 [IMPORT MODAL]: CSV Template Info Modal                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative z-10 w-full max-w-[460px] rounded-[14px] border shadow-2xl p-6 flex flex-col gap-4 ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#323232] border-[#444444] text-white"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-[#2EC4B6]" />
                  <h3 className="text-[15px] font-bold">
                    {isThai ? "นำเข้าข้อมูลสินค้า (CSV Import)" : "Import Products (CSV)"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {isThai
                  ? "ระบบรองรับการนำเข้าไฟล์ CSV ในรูปแบบ UTF-8 โดยต้องมีคอลัมน์มาตรฐาน: SKU, nameTh, nameEn, baseUnit, standardCost"
                  : "Upload a UTF-8 encoded CSV file matching standard columns: SKU, nameTh, nameEn, baseUnit, standardCost."}
              </p>

              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-black/20">
                <Download size={24} className="text-zinc-400" />
                <span className="text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300">
                  {isThai ? "ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์" : "Drag and drop CSV here or click to browse"}
                </span>
                <span className="text-[11px] text-zinc-400">
                  .csv (Max 10 MB)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  {isThai ? "ปิด" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
