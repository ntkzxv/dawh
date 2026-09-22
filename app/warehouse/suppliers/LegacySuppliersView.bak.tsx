"use client";

import React, { useState, useMemo } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Star,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Truck,
  CreditCard,
  FileText,
  Boxes,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SupplierItem {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  categoryTh: string;
  categoryEn: string;
  contactPersonTh: string;
  contactPersonEn: string;
  phone: string;
  email: string;
  addressTh: string;
  addressEn: string;
  leadTimeDays: number;
  paymentTermsTh: string;
  paymentTermsEn: string;
  rating: number; // 1-5
  totalOrders: number;
  activeOrders: number;
  status: "active" | "inactive" | "review";
  suppliedCategoriesTh: string[];
  suppliedCategoriesEn: string[];
  taxId: string;
  onTimeDeliveryRate: number; // percentage
}

const INITIAL_SUPPLIERS: SupplierItem[] = [
  {
    id: "sup-1",
    code: "VND-1001",
    nameTh: "บริษัท สยาม อิเล็กทริค พาวเวอร์ ซัพพลาย จำกัด",
    nameEn: "Siam Electric Power Supply Co., Ltd.",
    categoryTh: "เครื่องกำเนิดไฟฟ้าและหม้อแปลง",
    categoryEn: "Generators & Transformers",
    contactPersonTh: "คุณธีรภัทร ชาญวิวัฒน์",
    contactPersonEn: "Teerapat Chanwiwat",
    phone: "02-890-4400 ต่อ 21",
    email: "procurement@siamelectric.co.th",
    addressTh: "128/4 หมู่ 3 นิคมอุตสาหกรรมบางปู จ.สมุทรปราการ 10280",
    addressEn: "128/4 Moo 3, Bangpu Industrial Estate, Samut Prakan 10280",
    leadTimeDays: 7,
    paymentTermsTh: "เครดิต 30 วัน",
    paymentTermsEn: "Net 30 Days",
    rating: 4.8,
    totalOrders: 142,
    activeOrders: 4,
    status: "active",
    suppliedCategoriesTh: ["เครื่องปั่นไฟ", "หม้อแปลงไฟฟ้า", "ตู้สวิตช์บอร์ด"],
    suppliedCategoriesEn: ["Generators", "Transformers", "Switchboards"],
    taxId: "0105558012349",
    onTimeDeliveryRate: 98,
  },
  {
    id: "sup-2",
    code: "VND-1002",
    nameTh: "บริษัท เอเชีย เมทัล แอนด์ โฟล์คลิฟท์ เทรดดิ้ง จำกัด",
    nameEn: "Asia Metal & Forklift Trading Co., Ltd.",
    categoryTh: "เครื่องจักรกลและยานพาหนะคลัง",
    categoryEn: "Heavy Machinery & Forklifts",
    contactPersonTh: "คุณวรินทร์ดา อัศวโภคิน",
    contactPersonEn: "Varinda Assavapokin",
    phone: "038-215-990",
    email: "contact@asiametal-forklift.com",
    addressTh: "55/8 หมู่ 5 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230",
    addressEn: "55/8 Moo 5, Thungsukla, Sriracha, Chonburi 20230",
    leadTimeDays: 14,
    paymentTermsTh: "เครดิต 45 วัน",
    paymentTermsEn: "Net 45 Days",
    rating: 4.6,
    totalOrders: 86,
    activeOrders: 2,
    status: "active",
    suppliedCategoriesTh: ["รถโฟล์คลิฟท์ไฟฟ้า", "อะไหล่เครื่องยนต์", "แบตเตอรี่อุตสาหกรรม"],
    suppliedCategoriesEn: ["Electric Forklifts", "Engine Parts", "Industrial Batteries"],
    taxId: "0205561004521",
    onTimeDeliveryRate: 94,
  },
  {
    id: "sup-3",
    code: "VND-1003",
    nameTh: "บริษัท บางกอก ไวร์ แอนด์ เคเบิ้ล โซลูชั่นส์ จำกัด",
    nameEn: "Bangkok Wire & Cable Solutions Ltd.",
    categoryTh: "สายไฟและท่อร้อยสายส่ง",
    categoryEn: "Wiring & Conduits",
    contactPersonTh: "คุณศิริพงษ์ เจริญทรัพย์",
    contactPersonEn: "Siripong Charoensap",
    phone: "02-416-8822",
    email: "sales@bangkokcable-solutions.co.th",
    addressTh: "79 ซอยเทียนทะเล 20 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพฯ 10150",
    addressEn: "79 Soi Thian Thale 20, Samaedam, Bang Khun Thian, Bangkok 10150",
    leadTimeDays: 3,
    paymentTermsTh: "เครดิต 60 วัน",
    paymentTermsEn: "Net 60 Days",
    rating: 4.9,
    totalOrders: 310,
    activeOrders: 6,
    status: "active",
    suppliedCategoriesTh: ["สายไฟ THW", "ท่อร้อยสายไฟ EMT", "ข้อต่อท่อสายไฟ"],
    suppliedCategoriesEn: ["THW Cable", "EMT Conduit", "Conduit Fittings"],
    taxId: "0105543088219",
    onTimeDeliveryRate: 99,
  },
  {
    id: "sup-4",
    code: "VND-1004",
    nameTh: "บริษัท โกลบอล ออโตเมชั่น แอนด์ เซนเซอร์ เทค จำกัด",
    nameEn: "Global Automation & Sensor Tech Co., Ltd.",
    categoryTh: "เซนเซอร์และมิเตอร์ควบคุม",
    categoryEn: "Sensors & Measurement",
    contactPersonTh: "คุณอนุชา แสงจันทร์",
    contactPersonEn: "Anucha Saengchan",
    phone: "02-911-3040 ต่อ 15",
    email: "info@global-automation.co.th",
    addressTh: "302 ถนนรังสิต-นครนายก ต.ประชาธิปัตย์ อ.ธัญบุรี จ.ปทุมธานี 12130",
    addressEn: "302 Rangsit-Nakhon Nayok Rd., Prachatipat, Thanyaburi, Pathum Thani 12130",
    leadTimeDays: 5,
    paymentTermsTh: "เครดิต 30 วัน",
    paymentTermsEn: "Net 30 Days",
    rating: 4.2,
    totalOrders: 64,
    activeOrders: 1,
    status: "active",
    suppliedCategoriesTh: ["เครื่องวัดดิจิทัล", "เซนเซอร์อุณหภูมิ", "มิเตอร์ไฟฟ้าระบบ 3 เฟส"],
    suppliedCategoriesEn: ["Digital Meters", "Temperature Sensors", "3-Phase Power Meters"],
    taxId: "0135560002148",
    onTimeDeliveryRate: 91,
  },
  {
    id: "sup-5",
    code: "VND-1005",
    nameTh: "ห้างหุ้นส่วนจำกัด วี.ซี. ไฮโดรลิค อินดัสทรี",
    nameEn: "V.C. Hydraulic Industry Ltd., Part.",
    categoryTh: "ปั๊มน้ำและระบบไฮโดรลิก",
    categoryEn: "Pumps & Hydraulics",
    contactPersonTh: "คุณชูเกียรติ สว่างเนตร",
    contactPersonEn: "Chookiat Sawangnet",
    phone: "034-812-700",
    email: "vchydraulic@gmail.com",
    addressTh: "44/2 หมู่ 1 ถนนเพชรเกษม อ.กระทุ่มแบน จ.สมุทรสาคร 74110",
    addressEn: "44/2 Moo 1, Phetkasem Rd., Krathum Baen, Samut Sakhon 74110",
    leadTimeDays: 10,
    paymentTermsTh: "เงินสดเมื่อส่งมอบ",
    paymentTermsEn: "Cash on Delivery",
    rating: 3.8,
    totalOrders: 32,
    activeOrders: 0,
    status: "review",
    suppliedCategoriesTh: ["ปั๊มน้ำหอยโข่ง", "วาล์วแรงดันสูง", "สายไฮโดรลิกทนทาน"],
    suppliedCategoriesEn: ["Centrifugal Pumps", "High Pressure Valves", "Hydraulic Hoses"],
    taxId: "0743548001920",
    onTimeDeliveryRate: 84,
  },
  {
    id: "sup-6",
    code: "VND-1006",
    nameTh: "บริษัท กรีน ลูมินัส ไลท์ติ้ง คอร์ปอเรชั่น จำกัด",
    nameEn: "Green Luminous Lighting Corp., Ltd.",
    categoryTh: "โคมไฟและระบบแสงสว่างโซลาร์",
    categoryEn: "Lighting & Solar",
    contactPersonTh: "คุณมณฑิรา วาสนาดี",
    contactPersonEn: "Monthira Wasanadee",
    phone: "02-671-5580",
    email: "sales@greenluminous.com",
    addressTh: "88/12 อาคารเอ็มไพร์สเปซ ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120",
    addressEn: "88/12 Empire Space Bldg, South Sathon, Yannawa, Sathon, Bangkok 10120",
    leadTimeDays: 4,
    paymentTermsTh: "เครดิต 30 วัน",
    paymentTermsEn: "Net 30 Days",
    rating: 4.7,
    totalOrders: 118,
    activeOrders: 3,
    status: "active",
    suppliedCategoriesTh: ["ไฟถนนโซลาร์เซลล์", "สปอตไลท์ LED", "แผงควบคุมพลังงานแสงอาทิตย์"],
    suppliedCategoriesEn: ["Solar Street Lights", "LED Floodlights", "Solar Charge Controllers"],
    taxId: "0105559098711",
    onTimeDeliveryRate: 96,
  },
  {
    id: "sup-7",
    code: "VND-1007",
    nameTh: "บริษัท ไทยเซฟตี้ การ์ด แอนด์ อีควิปเมนท์ จำกัด",
    nameEn: "Thai Safety Guard & Equipment Co., Ltd.",
    categoryTh: "อุปกรณ์ความปลอดภัยคลังสินค้า",
    categoryEn: "Warehouse Safety Equipment",
    contactPersonTh: "คุณพงษ์ศักดิ์ รุ่งเจริญ",
    contactPersonEn: "Pongsak Rungcharoen",
    phone: "02-328-9100",
    email: "orders@thaisafetyguard.co.th",
    addressTh: "19/3 ซอยเฉลิมพระเกียรติ ร.9 แขวงหนองบอน เขตประเวศ กรุงเทพฯ 10250",
    addressEn: "19/3 Soi Chaloem Phra Kiat Rama 9, Nong Bon, Prawet, Bangkok 10250",
    leadTimeDays: 2,
    paymentTermsTh: "เครดิต 30 วัน",
    paymentTermsEn: "Net 30 Days",
    rating: 4.9,
    totalOrders: 205,
    activeOrders: 5,
    status: "active",
    suppliedCategoriesTh: ["รองเท้านิรภัย", "หมวกนิรภัย", "ถุงมือกันบาด", "ป้ายเตือนความปลอดภัย"],
    suppliedCategoriesEn: ["Safety Shoes", "Hard Hats", "Cut-Resistant Gloves", "Warning Signs"],
    taxId: "0105552011984",
    onTimeDeliveryRate: 99,
  },
  {
    id: "sup-8",
    code: "VND-1008",
    nameTh: "บริษัท พรีเมียร์ เซอร์กิต ซิสเต็มส์ จำกัด",
    nameEn: "Premier Circuit Systems Co., Ltd.",
    categoryTh: "อุปกรณ์เบรกเกอร์และป้องกันกระแสเกิน",
    categoryEn: "Circuit Breakers & Protection",
    contactPersonTh: "คุณจิราภรณ์ มงคลชัย",
    contactPersonEn: "Jiraporn Mongkolchai",
    phone: "02-530-7766",
    email: "contact@premiercircuit.co.th",
    addressTh: "105/9 ถนนลาดพร้าว แขวงคลองจั่น เขตบางกะปิ กรุงเทพฯ 10240",
    addressEn: "105/9 Lat Phrao Rd., Khlong Chan, Bang Kapi, Bangkok 10240",
    leadTimeDays: 6,
    paymentTermsTh: "เครดิต 45 วัน",
    paymentTermsEn: "Net 45 Days",
    rating: 4.5,
    totalOrders: 94,
    activeOrders: 2,
    status: "active",
    suppliedCategoriesTh: ["เบรกเกอร์ RCBO", "เบรกเกอร์ MCCB", "ฟิวส์อุตสาหกรรม"],
    suppliedCategoriesEn: ["RCBO Breakers", "MCCB Breakers", "Industrial Fuses"],
    taxId: "0105556073120",
    onTimeDeliveryRate: 95,
  },
];

export default function SuppliersPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  const [suppliers] = useState<SupplierItem[]>(INITIAL_SUPPLIERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Categories list for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      set.add(isThai ? s.categoryTh : s.categoryEn);
    });
    return Array.from(set);
  }, [suppliers, isThai]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.nameTh.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.contactPersonTh.toLowerCase().includes(q) ||
        s.contactPersonEn.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      const catName = isThai ? s.categoryTh : s.categoryEn;
      const matchCategory = selectedCategory === "all" || catName === selectedCategory;

      const matchStatus = selectedStatus === "all" || s.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [suppliers, searchQuery, selectedCategory, selectedStatus, isThai]);

  // Overall metric statistics
  const totalVendors = suppliers.length;
  const activeVendors = suppliers.filter((s) => s.status === "active").length;
  const avgLeadTime = Math.round(
    suppliers.reduce((acc, s) => acc + s.leadTimeDays, 0) / suppliers.length
  );
  const totalActiveOrders = suppliers.reduce((acc, s) => acc + s.activeOrders, 0);

  return (
    <WarehousePageTemplate
      titleEn="Supplier & Vendor Directory"
      titleTh="ทะเบียนผู้จำหน่ายและคู่ค้า"
      routePath="/warehouse/suppliers"
      iconName="suppliers"
      fullBleed
    >
      {/* workspace-content: fullBleed width layout matching inventory & stock */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* Action Header bar: export & add supplier */}
        <div className="w-full flex justify-end items-center gap-2.5">
          <button
            type="button"
            className={`box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[36px] rounded-lg border text-[13px] font-medium transition-all cursor-pointer ${
              isLight
                ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-50 shadow-xs"
                : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-white/5"
            }`}
            style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
          >
            <Download size={14} className={isLight ? "text-slate-600" : "text-[#F4F4F5]"} />
            <span>{isThai ? "ส่งออกรายชื่อ" : "Export List"}</span>
          </button>

          <button
            type="button"
            className={`box-border flex flex-row items-center px-4 py-2 gap-1.5 h-[36px] rounded-lg text-[13px] font-semibold transition-all cursor-pointer shadow-xs ${
              isLight
                ? "bg-slate-900 hover:bg-black text-white"
                : "bg-white hover:bg-zinc-200 text-black"
            }`}
            style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
          >
            <Plus size={15} className={isLight ? "text-white" : "text-black"} />
            <span>{isThai ? "เพิ่มผู้จำหน่ายใหม่" : "New Supplier"}</span>
          </button>
        </div>

        {/* Filter bar: Search + Category + Status */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div
              className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-2.5 h-[36px] rounded-lg border text-[13px] w-full sm:w-[280px] md:w-[340px] transition-colors ${
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
                    ? "ค้นหารหัส, ชื่อคู่ค้า, ผู้ติดต่อ, เบอร์โทร..."
                    : "Search Code, Name, Contact, Phone..."
                }
                className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#A1A1AA] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`h-[36px] px-3 rounded-lg border text-[13px] cursor-pointer outline-none transition-colors ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-800"
                  : "bg-[#383838] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              <option value="all">
                {isThai ? "ทุกหมวดหมู่อุปกรณ์" : "All Categories"}
              </option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`h-[36px] px-3 rounded-lg border text-[13px] cursor-pointer outline-none transition-colors ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-800"
                  : "bg-[#383838] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              <option value="all">{isThai ? "ทุกสถานะคู่ค้า" : "All Status"}</option>
              <option value="active">
                {isThai ? "พร้อมสั่งซื้อปกติ" : "Active Contracts"}
              </option>
              <option value="review">
                {isThai ? "อยู่ระหว่างทบทวนเกณฑ์" : "Under Review"}
              </option>
              <option value="inactive">
                {isThai ? "ระงับชั่วคราว" : "Inactive"}
              </option>
            </select>
          </div>

          {/* Result counter */}
          <div className="text-[12px] font-mono text-[#A1A1AA]">
            {isThai ? "พบข้อมูล" : "Showing"}{" "}
            <strong className={isLight ? "text-slate-900" : "text-white"}>
              {filteredSuppliers.length}
            </strong>{" "}
            {isThai ? "ราย" : "Suppliers"}
          </div>
        </div>

        {/* Suppliers Table: Rounded & Bordered matching Stock and Inventory */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${
            isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[940px]">
              <thead>
                <tr
                  className={`h-[42px] border-b text-[12px] font-semibold text-white select-none ${
                    isLight
                      ? "bg-slate-900 border-slate-800"
                      : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  <th className="py-2.5 px-4 w-[240px]">
                    {isThai ? "รหัสและชื่อผู้จำหน่าย" : "Supplier Code & Name"}
                  </th>
                  <th className="py-2.5 px-4 w-[190px]">
                    {isThai ? "หมวดสินค้าหลัก" : "Primary Category"}
                  </th>
                  <th className="py-2.5 px-4 w-[200px]">
                    {isThai ? "ผู้ติดต่อและช่องทาง" : "Contact Person & Info"}
                  </th>
                  <th className="py-2.5 px-4 text-center w-[120px]">
                    {isThai ? "ระยะเวลาส่งมอบ" : "Lead Time"}
                  </th>
                  <th className="py-2.5 px-4 text-center w-[130px]">
                    {isThai ? "เงื่อนไขชำระเงิน" : "Payment Terms"}
                  </th>
                  <th className="py-3 px-4 text-center w-[120px]">
                    {isThai ? "คำสั่งซื้อค้างส่ง" : "Active Orders"}
                  </th>
                  <th className="py-3 px-4 text-center w-[120px]">
                    {isThai ? "สถานะคู่ค้า" : "Status"}
                  </th>
                  <th className="py-3 px-4 text-center w-[80px]">
                    {isThai ? "รายละเอียด" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? "divide-slate-200" : "divide-white/5"
                }`}
              >
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      {isThai
                        ? "ไม่พบข้อมูลผู้จำหน่ายที่ตรงกับเงื่อนไขการค้นหา"
                        : "No suppliers match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => {
                    const isSelected = selectedSupplier?.id === supplier.id;

                    return (
                      <tr
                        key={supplier.id}
                        onClick={() => setSelectedSupplier(supplier)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "bg-slate-100/90"
                              : "bg-white/[0.08]"
                            : isLight
                            ? "hover:bg-slate-50"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        {/* Supplier Code & Name */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-mono font-semibold text-[12.5px] ${
                              isLight ? "text-slate-800" : "text-zinc-200"
                            }`}
                          >
                            {supplier.code}
                          </div>
                          <div
                            className={`font-semibold text-[13.5px] line-clamp-1 max-w-[230px] ${
                              isLight ? "text-slate-900" : "text-white/90"
                            }`}
                          >
                            {isThai ? supplier.nameTh : supplier.nameEn}
                          </div>
                          <div
                            className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                              isLight ? "text-slate-500" : "text-zinc-400"
                            }`}
                          >
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span>{supplier.rating.toFixed(1)}</span>
                            <span>·</span>
                            <span>{supplier.onTimeDeliveryRate}% ตรงเวลา</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[11.5px] font-medium ${
                              isLight
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-white/5 text-zinc-200 border border-white/10"
                            }`}
                          >
                            {isThai ? supplier.categoryTh : supplier.categoryEn}
                          </span>
                        </td>

                        {/* Contact Person & Info */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-medium ${
                              isLight ? "text-slate-900" : "text-zinc-200"
                            }`}
                          >
                            {isThai ? supplier.contactPersonTh : supplier.contactPersonEn}
                          </div>
                          <div
                            className={`text-[11.5px] flex items-center gap-1 mt-0.5 ${
                              isLight ? "text-slate-500" : "text-zinc-400"
                            }`}
                          >
                            <Phone size={11} className="shrink-0" />
                            <span>{supplier.phone}</span>
                          </div>
                        </td>

                        {/* Lead Time */}
                        <td className="py-3.5 px-4 text-center">
                          <div
                            className={`font-mono font-bold text-[13px] ${
                              supplier.leadTimeDays <= 3
                                ? "text-emerald-500"
                                : supplier.leadTimeDays > 10
                                ? "text-amber-500"
                                : isLight
                                ? "text-slate-900"
                                : "text-white"
                            }`}
                          >
                            {supplier.leadTimeDays} {isThai ? "วัน" : "Days"}
                          </div>
                        </td>

                        {/* Payment Terms */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono text-[12px] font-medium px-2 py-0.5 rounded ${
                              isLight ? "bg-slate-100 text-slate-700" : "bg-[#282828] text-zinc-300"
                            }`}
                          >
                            {isThai ? supplier.paymentTermsTh : supplier.paymentTermsEn}
                          </span>
                        </td>

                        {/* Active Orders */}
                        <td className="py-3.5 px-4 text-center">
                          {supplier.activeOrders > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 font-mono font-bold text-[12.5px] px-2 py-0.5 rounded-full ${
                                isLight
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-white/10 text-white"
                              }`}
                            >
                              <Package size={12} />
                              {supplier.activeOrders} {isThai ? "รายการ" : "POs"}
                            </span>
                          ) : (
                            <span className="text-[12px] text-zinc-500">-</span>
                          )}
                        </td>

                        {/* Status (Color reserved strictly for non-standard/review status) */}
                        <td className="py-3.5 px-4 text-center">
                          {supplier.status === "active" ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isLight
                                  ? "bg-slate-100 text-slate-800 border border-slate-200"
                                  : "bg-white/10 text-zinc-200 border border-white/10"
                              }`}
                            >
                              {isThai ? "ปกติ" : "Active"}
                            </span>
                          ) : supplier.status === "review" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                              {isThai ? "รอทบทวน" : "Review"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                              {isThai ? "ระงับ" : "Inactive"}
                            </span>
                          )}
                        </td>

                        {/* Action Details Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupplier(supplier);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight
                                ? "hover:bg-slate-200 text-slate-600"
                                : "hover:bg-white/10 text-zinc-400 hover:text-white"
                            }`}
                            title={isThai ? "ดูรายละเอียดคู่ค้า" : "View Supplier Details"}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📌 [DETAIL DRAWER]: ข้อมูลเชิงลึกของผู้จำหน่ายที่ถูกเลือก */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedSupplier && (
          <>
            {/* Backdrop for small screens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSupplier(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed top-0 right-0 bottom-0 w-full sm:w-[450px] z-50 flex flex-col p-6 border-l shadow-2xl overflow-y-auto ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800"
                  : "bg-[#282828] border-[#444444] text-zinc-100"
              }`}
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-[32px] h-[32px] rounded-lg flex items-center justify-center ${
                      isLight ? "bg-slate-900 text-white" : "bg-white text-black"
                    }`}
                  >
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15.5px] leading-tight">
                      {isThai ? "ข้อมูลผู้จำหน่าย" : "Supplier Profile"}
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {selectedSupplier.code}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? "hover:bg-slate-100 text-slate-500"
                      : "hover:bg-white/10 text-zinc-400"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Profile Info */}
              <div className="py-5 flex flex-col gap-5">
                {/* Supplier Name & Category */}
                <div>
                  <h4 className="text-[17px] font-bold leading-tight">
                    {isThai ? selectedSupplier.nameTh : selectedSupplier.nameEn}
                  </h4>
                  <p className="text-[12.5px] text-zinc-400 mt-1">
                    {isThai ? selectedSupplier.categoryTh : selectedSupplier.categoryEn}
                  </p>
                </div>

                {/* Performance Cards (4 Grid) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#303030] border-[#444444]"
                    }`}
                  >
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                      {isThai ? "ระยะเวลาส่งมอบ" : "Lead Time"}
                    </span>
                    <span className="text-[15px] font-bold font-mono">
                      {selectedSupplier.leadTimeDays} {isThai ? "วัน" : "Days"}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#303030] border-[#444444]"
                    }`}
                  >
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <CreditCard size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                      {isThai ? "เครดิตชำระ" : "Payment Terms"}
                    </span>
                    <span className="text-[13px] font-bold truncate">
                      {isThai ? selectedSupplier.paymentTermsTh : selectedSupplier.paymentTermsEn}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#303030] border-[#444444]"
                    }`}
                  >
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      {isThai ? "คะแนนคุณภาพ" : "Vendor Rating"}
                    </span>
                    <span className="text-[15px] font-bold font-mono">
                      {selectedSupplier.rating.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#303030] border-[#444444]"
                    }`}
                  >
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Truck size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                      {isThai ? "ส่งมอบตรงเวลา" : "On-Time Fulfillment"}
                    </span>
                    <span className="text-[15px] font-bold font-mono">
                      {selectedSupplier.onTimeDeliveryRate}%
                    </span>
                  </div>
                </div>

                {/* Contact & Registration Information */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-3 text-[12.5px] ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-[#303030] border-[#444444]"
                  }`}
                >
                  <h5 className="font-bold text-[12px] uppercase text-zinc-400">
                    {isThai ? "ข้อมูลการติดต่อและจัดส่ง" : "Contact & Fulfillment Info"}
                  </h5>

                  <div className="flex items-start gap-2.5">
                    <Users size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block">
                        {isThai ? "ผู้ประสานงานหลัก" : "Primary Contact"}
                      </span>
                      <span className="font-semibold">
                        {isThai
                          ? selectedSupplier.contactPersonTh
                          : selectedSupplier.contactPersonEn}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block">
                        {isThai ? "เบอร์โทรศัพท์" : "Phone Number"}
                      </span>
                      <span className="font-mono font-medium">{selectedSupplier.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block">
                        {isThai ? "อีเมลจัดซื้อ" : "Procurement Email"}
                      </span>
                      <span className="font-mono">{selectedSupplier.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block">
                        {isThai ? "ที่อยู่สำนักงาน / โรงงาน" : "Factory / Office Address"}
                      </span>
                      <span>
                        {isThai ? selectedSupplier.addressTh : selectedSupplier.addressEn}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/5">
                    <FileText size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-zinc-400 block">
                        {isThai ? "เลขประจำตัวผู้เสียภาษี" : "Tax Registration ID"}
                      </span>
                      <span className="font-mono font-medium">{selectedSupplier.taxId}</span>
                    </div>
                  </div>
                </div>

                {/* Supplied Product Categories Chips */}
                <div className="flex flex-col gap-2">
                  <h5 className="font-bold text-[12px] uppercase text-zinc-400">
                    {isThai ? "รายการกลุ่มสินค้าที่จัดส่ง" : "Supplied Product Lines"}
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {(isThai
                      ? selectedSupplier.suppliedCategoriesTh
                      : selectedSupplier.suppliedCategoriesEn
                    ).map((cat, i) => (
                      <span
                        key={i}
                        className={`text-[11.5px] px-2.5 py-1 rounded-md border font-medium ${
                          isLight
                            ? "bg-slate-100 border-slate-200 text-slate-800"
                            : "bg-[#333333] border-[#484848] text-zinc-200"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center gap-2.5">
                <button
                  type="button"
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-[13px] transition-all cursor-pointer shadow-xs ${
                    isLight
                      ? "bg-slate-900 hover:bg-black text-white"
                      : "bg-white hover:bg-zinc-200 text-black"
                  }`}
                >
                  {isThai ? "ออกใบสั่งซื้อ (PO)" : "Create Purchase Order"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className={`py-2.5 px-4 rounded-lg font-medium text-[13px] border transition-colors cursor-pointer ${
                    isLight
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-[#333333] border-[#444444] text-zinc-200 hover:bg-[#383838]"
                  }`}
                >
                  {isThai ? "ปิด" : "Close"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </WarehousePageTemplate>
  );
}
