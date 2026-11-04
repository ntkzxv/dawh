"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, FilePlus2, LockKeyhole, ReceiptText, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/common/Button";
import DataTable, { dataTableFrameClassName, type DataTableColumn } from "@/components/common/DataTable";
import FilterDropdown from "@/components/common/FilterDropdown";
import SearchInput from "@/components/common/SearchInput";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export type SalesPageKind = "transactions" | "new-sale" | "customers" | "receivables" | "payments" | "hire-purchase";

type TableColumnCopy = { key: string; th: string; en: string };
type ListPageCopy = {
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  searchTh: string;
  searchEn: string;
  actionTh: string;
  actionEn: string;
  emptyTh: string;
  emptyEn: string;
  noteTh: string;
  noteEn: string;
  columns: TableColumnCopy[];
};

const listPages: Record<"transactions" | "customers" | "receivables" | "payments", ListPageCopy> = {
  transactions: {
    titleTh: "รายการขาย",
    titleEn: "Sales records",
    descriptionTh: "บันทึกรายการหลังการซื้อและชำระเงินจริงที่หน้าร้าน",
    descriptionEn: "Record transactions after the in-store purchase and payment have happened.",
    searchTh: "ค้นหาจากข้อมูลลูกค้าหรือรายการขาย",
    searchEn: "Search customers or sales",
    actionTh: "บันทึกการขาย",
    actionEn: "Record a sale",
    emptyTh: "ยังไม่มีรายการขาย",
    emptyEn: "No sales have been recorded yet.",
    noteTh: "ระบบบันทึกข้อมูลธุรกรรมย้อนหลัง ไม่ได้เรียกเก็บเงินจากลูกค้า",
    noteEn: "This workspace records completed in-store transactions; it does not charge customers.",
    columns: [
      { key: "customer", th: "ลูกค้า", en: "Customer" },
      { key: "products", th: "สินค้าและจำนวน", en: "Products and quantities" },
      { key: "payment", th: "ยอดชำระจริง", en: "Actual payment" },
      { key: "receivable", th: "ยอดคงค้าง", en: "Remaining balance" },
      { key: "enteredBy", th: "ผู้บันทึก", en: "Entered by" },
      { key: "createdAt", th: "วันที่บันทึก", en: "Recorded at" },
    ],
  },
  customers: {
    titleTh: "ลูกค้าและลูกหนี้",
    titleEn: "Customers and debtors",
    descriptionTh: "ข้อมูลประจำตัวลูกค้าและประวัติการขายกับการรับชำระ",
    descriptionEn: "Customer profiles with their sales and payment history.",
    searchTh: "ค้นหาลูกค้า",
    searchEn: "Search customers",
    actionTh: "เพิ่มลูกค้า",
    actionEn: "Add customer",
    emptyTh: "ยังไม่มีข้อมูลลูกค้า",
    emptyEn: "No customer profiles yet.",
    noteTh: "รายละเอียดช่องข้อมูลลูกค้าจะยืนยันก่อนเชื่อมกับฐานข้อมูลจริง",
    noteEn: "Customer profile fields will be confirmed before connecting this page to live records.",
    columns: [
      { key: "customer", th: "ลูกค้า", en: "Customer" },
      { key: "contact", th: "ข้อมูลติดต่อ", en: "Contact details" },
      { key: "sales", th: "ประวัติการขาย", en: "Sales history" },
      { key: "receivables", th: "ประวัติลูกหนี้", en: "Receivable history" },
    ],
  },
  receivables: {
    titleTh: "ลูกหนี้ลูกค้า",
    titleEn: "Customer receivables",
    descriptionTh: "ติดตามยอดคงค้างที่เกิดจากรายการขายของลูกค้า",
    descriptionEn: "Review customer balances created by recorded sales.",
    searchTh: "ค้นหาลูกค้าหรือรายการขาย",
    searchEn: "Search customers or sales",
    actionTh: "ดูการรับชำระ",
    actionEn: "View payments",
    emptyTh: "ยังไม่มีรายการลูกหนี้",
    emptyEn: "No receivables yet.",
    noteTh: "การคำนวณยอดคงค้างและกำหนดชำระจะเชื่อมเมื่อข้อกำหนดได้รับการสรุป",
    noteEn: "Balance and due-date rules will be connected after the business requirements are approved.",
    columns: [
      { key: "customer", th: "ลูกค้า", en: "Customer" },
      { key: "sale", th: "รายการขายอ้างอิง", en: "Related sale" },
      { key: "amount", th: "ยอดคงค้าง", en: "Outstanding amount" },
      { key: "payments", th: "ประวัติรับชำระ", en: "Payment history" },
    ],
  },
  payments: {
    titleTh: "ประวัติรับชำระ",
    titleEn: "Payment records",
    descriptionTh: "บันทึกการชำระเงินจริงที่เกิดขึ้นแล้ว และเชื่อมกับลูกค้าหรือรายการขาย",
    descriptionEn: "Record actual payments that have already happened and link them to a customer or sale.",
    searchTh: "ค้นหาลูกค้าหรือรายการขาย",
    searchEn: "Search customers or sales",
    actionTh: "รูปแบบการรับชำระ",
    actionEn: "Payment setup",
    emptyTh: "ยังไม่มีประวัติรับชำระ",
    emptyEn: "No payment records yet.",
    noteTh: "ระบบไม่ตัดเงินหรือเรียกเก็บเงินอัตโนมัติ รายละเอียดช่องทางรับชำระยังรอกำหนด",
    noteEn: "No automatic charges are made. Accepted payment details are still to be defined.",
    columns: [
      { key: "date", th: "วันที่รับชำระ", en: "Payment date" },
      { key: "customer", th: "ลูกค้า", en: "Customer" },
      { key: "sale", th: "รายการขายอ้างอิง", en: "Related sale" },
      { key: "amount", th: "ยอดชำระจริง", en: "Actual amount" },
      { key: "enteredBy", th: "ผู้บันทึก", en: "Entered by" },
    ],
  },
};

export default function SalesResourcePage({ kind }: { kind: SalesPageKind }) {
  if (kind === "new-sale") return <NewSalePage />;
  if (kind === "hire-purchase") return <HirePurchasePage />;
  return <SalesListPage kind={kind} />;
}

function SalesListPage({ kind }: { kind: "transactions" | "customers" | "receivables" | "payments" }) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const copy = listPages[kind];
  const action = kind === "transactions" ? (
    <Link href="/sales/transactions/new" className={`inline-flex h-[33px] items-center gap-1.5 rounded-[6px] px-3.5 text-[13px] font-semibold transition hover:opacity-90 ${isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"}`}>
      <FilePlus2 size={14} aria-hidden="true" />
      {isThai ? copy.actionTh : copy.actionEn}
    </Link>
  ) : kind === "receivables" ? (
    <Link href="/sales/payments" className={`inline-flex h-[33px] items-center gap-1.5 rounded-[6px] border px-3.5 text-[13px] font-medium ${isLight ? "border-[#737D88] bg-white text-[#222222] hover:bg-[#F1F5F9]" : "border-[#E4E4E7] bg-[#383838] text-[#F4F4F5] hover:bg-[#444444]"}`}>
      <Wallet size={14} aria-hidden="true" />
      {isThai ? copy.actionTh : copy.actionEn}
    </Link>
  ) : (
    <Button variant="primary" disabled icon={<FilePlus2 size={14} aria-hidden="true" />} title={isThai ? "รอกำหนดข้อมูลและขั้นตอน" : "Waiting for field and workflow decisions."}>
      {isThai ? copy.actionTh : copy.actionEn}
    </Button>
  );

  const columns: DataTableColumn<never>[] = copy.columns.map((column) => ({
    key: column.key,
    header: isThai ? column.th : column.en,
  }));

  return (
    <SalesPageFrame titleEn={copy.titleEn} titleTh={copy.titleTh}>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <p className={`max-w-2xl text-sm leading-6 ${isLight ? "text-[#383838]" : "text-[#E4E4E7]"}`}>
          {isThai ? copy.descriptionTh : copy.descriptionEn}
        </p>
        {action}
      </section>

      <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${isLight ? "border-[#E4E4E7] bg-white text-[#383838]" : "border-[#444444] bg-[#383838] text-[#E4E4E7]"}`}>
        <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>{isThai ? copy.noteTh : copy.noteEn}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value=""
            onChange={() => {}}
            disabled
            placeholder={isThai ? copy.searchTh : copy.searchEn}
            width="w-full sm:w-[280px]"
          />
          <FilterDropdown
            value="all"
            onChange={() => {}}
            disabled
            placeholder={isThai ? "ตัวกรอง" : "Filters"}
            options={[{ value: "all", label: isThai ? "ทุกข้อมูล" : "All records" }]}
          />
        </div>
        <span className={`text-xs ${isLight ? "text-[#737D88]" : "text-[#E4E4E7]"}`}>
          {isThai ? "ตัวกรองจะเปิดใช้เมื่อเชื่อมข้อมูลจริง" : "Filters will be enabled when live data is connected."}
        </span>
      </div>

      <div className={dataTableFrameClassName(isLight)}>
        <DataTable
          columns={columns}
          data={[]}
          keyExtractor={(_, index) => `${kind}-${index}`}
          emptyIcon={kind === "customers" ? <UserRound size={34} /> : <ReceiptText size={34} />}
          emptyTitle={isThai ? copy.emptyTh : copy.emptyEn}
          minWidth="900px"
        />
      </div>
    </SalesPageFrame>
  );
}

function NewSalePage() {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const surface = isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]";
  const muted = isLight ? "text-[#383838]" : "text-[#E4E4E7]";
  const steps = isThai
    ? ["ข้อมูลลูกค้า", "ยอดชำระจริง", "สินค้าและจำนวน"]
    : ["Customer", "Actual payment", "Products and quantities"];

  return (
    <SalesPageFrame titleEn="Record a sale" titleTh="บันทึกการขาย">
      <div>
        <Link href="/sales/transactions" className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline ${muted}`}>
          <ArrowLeft size={14} aria-hidden="true" />
          {isThai ? "กลับไปรายการขาย" : "Back to sales"}
        </Link>
        <p className={`mt-4 max-w-3xl text-sm leading-6 ${muted}`}>
          {isThai
            ? "บันทึกธุรกรรมหลังการซื้อและชำระเงินเกิดขึ้นแล้วที่หน้าร้าน โดยเรียงข้อมูลลูกค้า การชำระเงินจริง และสินค้า"
            : "Record the transaction after the in-store purchase and payment, in the documented order: customer, actual payment, then products."}
        </p>
      </div>

      <ol className="grid gap-3 md:grid-cols-3" aria-label={isThai ? "ขั้นตอนบันทึกการขาย" : "Sale recording steps"}>
        {steps.map((step, index) => (
          <li key={step} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${index === 0 ? surface : isLight ? "border-[#E4E4E7] bg-[#F8FAFC]" : "border-[#444444] bg-[#2C2C2C]"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]" : isLight ? "bg-white text-[#737D88]" : "bg-[#383838] text-[#E4E4E7]"}`}>
              {`0${index + 1}`}
            </span>
            <span className={`text-sm font-medium ${index === 0 ? isLight ? "text-[#222222]" : "text-white" : muted}`}>{step}</span>
            {index < steps.length - 1 && <ArrowRight size={14} className={`ml-auto hidden md:block ${muted}`} aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <section className={`rounded-2xl border p-5 sm:p-6 ${surface}`}>
        <div className="flex items-start gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#F1F5F9] text-[#222222]" : "bg-[#2C2C2C] text-white"}`}>
            <UserRound size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className={`text-base font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{steps[0]}</h2>
            <p className={`mt-1 text-sm ${muted}`}>{isThai ? "ค้นหาลูกค้าเดิมหรือเตรียมเพิ่มข้อมูลลูกค้าใหม่" : "Find an existing customer or prepare a new customer profile."}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput value="" onChange={() => {}} disabled placeholder={isThai ? "ค้นหาจากทะเบียนลูกค้า" : "Search customer records"} width="w-full sm:max-w-md" />
          <Button variant="secondary" disabled icon={<UserRound size={14} aria-hidden="true" />}>
            {isThai ? "เลือกหรือเพิ่มลูกค้า" : "Select or add customer"}
          </Button>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 sm:p-6 ${surface}`}>
        <div className="flex items-start gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#F1F5F9] text-[#222222]" : "bg-[#2C2C2C] text-white"}`}>
            <Wallet size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-base font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{steps[1]}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${isLight ? "border-[#CE8D10]/30 bg-[#CE8D10]/10 text-[#222222]" : "border-[#FF9F1C]/30 bg-[#FF9F1C]/15 text-[#F4F4F5]"}`}>
                {isThai ? "รอกำหนดช่องข้อมูล" : "Fields to be defined"}
              </span>
            </div>
            <p className={`mt-1 text-sm leading-6 ${muted}`}>
              {isThai ? "บันทึกเฉพาะการชำระที่เกิดขึ้นจริง รายละเอียดวิธีชำระและหลักฐานยังต้องตกลงก่อน" : "Only record payments that have happened. Accepted methods and proof requirements still need to be decided."}
            </p>
          </div>
        </div>
        <div className={`mt-5 rounded-xl border border-dashed px-4 py-5 text-sm ${isLight ? "border-[#737D88] bg-[#F8FAFC] text-[#737D88]" : "border-[#555555] bg-[#2C2C2C] text-[#E4E4E7]"}`}>
          {isThai ? "พื้นที่รายละเอียดการชำระเงินจริง" : "Actual payment details area"}
        </div>
      </section>

      <section className={`rounded-2xl border p-5 sm:p-6 ${surface}`}>
        <div className="flex items-start gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#F1F5F9] text-[#222222]" : "bg-[#2C2C2C] text-white"}`}>
            <ReceiptText size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className={`text-base font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{steps[2]}</h2>
            <p className={`mt-1 text-sm leading-6 ${muted}`}>
              {isThai ? "เลือกสินค้าจากคลังสาขาและระบุจำนวน จุดตัดสต็อกและการแก้ไขรายการยังรอสรุป" : "Select products from the branch warehouse and enter quantities. Stock posting and correction rules are still open."}
            </p>
          </div>
        </div>
        <div className={`mt-5 flex min-h-24 items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm ${isLight ? "border-[#737D88] bg-[#F8FAFC] text-[#737D88]" : "border-[#555555] bg-[#2C2C2C] text-[#E4E4E7]"}`}>
          {isThai ? "รายการสินค้าจะปรากฏหลังเลือกข้อมูลลูกค้าและสรุปขั้นตอนแล้ว" : "Products will appear after customer selection and workflow rules are finalized."}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled>{isThai ? "บันทึกร่าง" : "Save draft"}</Button>
        <Button variant="primary" disabled icon={<ArrowRight size={14} aria-hidden="true" />} iconPosition="right">
          {isThai ? "ดำเนินการต่อ" : "Continue"}
        </Button>
      </div>
    </SalesPageFrame>
  );
}

function HirePurchasePage() {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const muted = isLight ? "text-[#383838]" : "text-[#E4E4E7]";
  const requirements = isThai
    ? ["เงื่อนไขและระยะเวลาสัญญา", "เงินดาวน์ ดอกเบี้ย และค่าธรรมเนียม", "วิธีคำนวณตารางชำระ", "การรับชำระ ปรับปรุง และกลับรายการ", "สิทธิ์ผู้อนุมัติและผู้แก้ไข"]
    : ["Contract terms and duration", "Down payment, interest, and fees", "Repayment schedule calculation", "Payment, adjustment, and reversal rules", "Approval and edit permissions"];

  return (
    <SalesPageFrame titleEn="Hire-purchase agreements" titleTh="สัญญาเช่าซื้อ">
      <section className={`rounded-2xl border p-5 sm:p-7 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
        <div className="flex items-start gap-4">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#CE8D10]/10 text-[#CE8D10]" : "bg-[#FF9F1C]/15 text-[#FF9F1C]"}`}>
            <LockKeyhole size={20} aria-hidden="true" />
          </span>
          <div>
            <p className={`text-xs font-semibold ${isLight ? "text-[#CE8D10]" : "text-[#FF9F1C]"}`}>{isThai ? "รอกำหนดกติกาธุรกิจ" : "Business rules pending"}</p>
            <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>
              {isThai ? "ยังไม่เปิดสร้างสัญญาเช่าซื้อ" : "Hire-purchase setup is not ready"}
            </h2>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${muted}`}>
              {isThai ? "เอกสารโครงการระบุให้กำหนดเงื่อนไขสัญญา ตารางชำระ และวิธีรับชำระก่อนสร้างข้อมูลทางการเงิน หน้านี้จึงวางโครงสำหรับข้อกำหนด โดยยังไม่คำนวณค่างวดหรือสร้างสัญญาจริง" : "The project guide requires contract terms, schedules, and payment rules to be approved before financial records are created. This page captures that scope without calculating installments or creating contracts."}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className={`mb-3 text-sm font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{isThai ? "ประเด็นที่ต้องสรุปก่อนเปิดใช้งาน" : "Decisions needed before activation"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {requirements.map((requirement, index) => (
            <article key={requirement} className={`flex items-start gap-3 rounded-xl border p-4 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isLight ? "bg-[#F1F5F9] text-[#222222]" : "bg-[#2C2C2C] text-[#F4F4F5]"}`}>{index + 1}</span>
              <p className={`text-sm leading-5 ${muted}`}>{requirement}</p>
            </article>
          ))}
        </div>
      </section>
      <Link href="/sales/receivables" className={`inline-flex items-center gap-1.5 text-sm font-semibold hover:underline ${muted}`}>
        {isThai ? "ไปหน้าลูกหนี้ลูกค้า" : "Go to customer receivables"}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </SalesPageFrame>
  );
}
