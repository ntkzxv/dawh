export type AuditCategory = {
  id: string;
  labelTh: string;
  labelEn: string;
  descriptionTh: string;
  descriptionEn: string;
  actions: string[];
  entityTypes: string[];
  count?: number;
};

export const ALL_AUDIT_CATEGORIES = "__all__";

export const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    id: "catalog",
    labelTh: "สินค้าและข้อมูลตั้งต้น",
    labelEn: "Products and catalogs",
    descriptionTh: "สร้างหรือแก้ไขสินค้าและรายการตั้งต้น",
    descriptionEn: "Create or update products and catalog data",
    actions: ["CATALOG_CREATED", "CATALOG_UPDATED"],
    entityTypes: ["branches", "warehouses", "suppliers", "units", "product_groups", "product_categories", "brands", "product_models", "products"],
  },
  {
    id: "goods-receiving",
    labelTh: "รับสินค้าเข้าคลัง",
    labelEn: "Goods receiving",
    descriptionTh: "นับรับสินค้าและบันทึกสินค้าเข้าสต็อก",
    descriptionEn: "Count received goods and post them to stock",
    actions: ["GOODS_COUNTED", "STOCK_POSTED"],
    entityTypes: ["goods_receipts", "inventory_documents"],
  },
  {
    id: "stock-movement",
    labelTh: "เคลื่อนไหวสต็อก",
    labelEn: "Stock movements",
    descriptionTh: "ลงรายการเบิก ปรับยอด โอนคลัง และกลับรายการ",
    descriptionEn: "Post issues, adjustments, transfers, and reversals",
    actions: ["STOCK_DOCUMENT_POSTED", "STOCK_DOCUMENT_REVERSED"],
    entityTypes: ["inventory_documents"],
  },
  {
    id: "purchase-orders",
    labelTh: "ใบสั่งซื้อ",
    labelEn: "Purchase orders",
    descriptionTh: "สร้าง แก้ไข และปิดใบสั่งซื้อ",
    descriptionEn: "Create, revise, and close purchase orders",
    actions: ["PO_RECORDED", "PO_REVISED", "PO_CLOSED"],
    entityTypes: ["purchase_orders"],
  },
  {
    id: "receipts",
    labelTh: "รับสินค้าจากผู้ขาย/ขนส่ง",
    labelEn: "Supplier and carrier receipts",
    descriptionTh: "บันทึกหรือแก้ไขการรับสินค้า และยืนยันการส่งถึง",
    descriptionEn: "Record or revise receipts and confirm deliveries",
    actions: [
      "SUPPLIER_RECEIPT_RECORDED",
      "SUPPLIER_RECEIPT_REVISED",
      "CARRIER_RECEIPT_RECORDED",
      "CARRIER_RECEIPT_REVISED",
      "DELIVERY_CONFIRMED",
    ],
    entityTypes: ["supplier_receipts", "carrier_receipts", "delivery_confirmations"],
  },
  {
    id: "issues-claims",
    labelTh: "ปัญหาและการติดตามเคลม",
    labelEn: "Issues and claims",
    descriptionTh: "แจ้งปัญหา เปลี่ยนสถานะ และเพิ่มบันทึกติดตาม",
    descriptionEn: "Report issues, change status, and add claim notes",
    actions: ["ISSUE_REPORTED", "ISSUE_STATUS_CHANGED", "CLAIM_NOTE_ADDED"],
    entityTypes: ["issue_reports", "claim_tracking"],
  },
  {
    id: "members-accounts",
    labelTh: "สมาชิกและบัญชี",
    labelEn: "Members and accounts",
    descriptionTh: "จัดการสมาชิก อีเมล และรหัสผ่าน",
    descriptionEn: "Manage members, email, and passwords",
    actions: [
      "MEMBER_CREATED",
      "MEMBER_UPDATED",
      "MEMBER_DELETED",
      "MEMBER_RESTORED",
      "MEMBER_PASSWORD_RESET",
      "MEMBER_EMAIL_CHANGED",
      "PASSWORD_CHANGED",
    ],
    entityTypes: ["app_users"],
  },
  {
    id: "organization",
    labelTh: "ข้อมูลองค์กร",
    labelEn: "Organization",
    descriptionTh: "ตั้งค่าหรือแก้ไขข้อมูลองค์กร",
    descriptionEn: "Set up or update organization details",
    actions: ["ORGANIZATION_SETUP", "ORGANIZATION_UPDATED"],
    entityTypes: ["organization_settings"],
  },
  {
    id: "evidence-files",
    labelTh: "ไฟล์หลักฐาน",
    labelEn: "Evidence files",
    descriptionTh: "อัปโหลดไฟล์หลักฐาน",
    descriptionEn: "Upload evidence files",
    actions: ["EVIDENCE_UPLOADED"],
    entityTypes: ["media_assets"],
  },
];

export function getAuditCategoryKey(category: AuditCategory) {
  return category.id;
}

export function getAuditCategoryLabel(category: AuditCategory, isThai: boolean) {
  return isThai ? category.labelTh : category.labelEn;
}

export function getAuditCategoryDescription(
  category: AuditCategory,
  isThai: boolean,
) {
  return isThai ? category.descriptionTh : category.descriptionEn;
}

const AUDIT_ACTION_LABELS: Record<string, [string, string]> = {
  CATALOG_CREATED: ["สร้างข้อมูลตั้งต้น", "Catalog created"],
  CATALOG_UPDATED: ["แก้ไขข้อมูลตั้งต้น", "Catalog updated"],
  GOODS_COUNTED: ["นับรับสินค้า", "Goods counted"],
  STOCK_POSTED: ["บันทึกสินค้าเข้าสต็อก", "Stock posted"],
  STOCK_DOCUMENT_POSTED: ["ลงรายการสต็อก", "Stock document posted"],
  STOCK_DOCUMENT_REVERSED: ["กลับรายการสต็อก", "Stock document reversed"],
  PO_RECORDED: ["สร้างใบสั่งซื้อ", "Purchase order recorded"],
  PO_REVISED: ["แก้ไขใบสั่งซื้อ", "Purchase order revised"],
  PO_CLOSED: ["ปิดใบสั่งซื้อ", "Purchase order closed"],
  SUPPLIER_RECEIPT_RECORDED: ["บันทึกรับสินค้าจากผู้ขาย", "Supplier receipt recorded"],
  SUPPLIER_RECEIPT_REVISED: ["แก้ไขรายการรับจากผู้ขาย", "Supplier receipt revised"],
  CARRIER_RECEIPT_RECORDED: ["บันทึกรับสินค้าจากขนส่ง", "Carrier receipt recorded"],
  CARRIER_RECEIPT_REVISED: ["แก้ไขรายการรับจากขนส่ง", "Carrier receipt revised"],
  DELIVERY_CONFIRMED: ["ยืนยันการส่งถึง", "Delivery confirmed"],
  ISSUE_REPORTED: ["แจ้งปัญหา", "Issue reported"],
  ISSUE_STATUS_CHANGED: ["เปลี่ยนสถานะปัญหา", "Issue status changed"],
  CLAIM_NOTE_ADDED: ["เพิ่มบันทึกติดตามเคลม", "Claim note added"],
  MEMBER_CREATED: ["เพิ่มสมาชิก", "Member created"],
  MEMBER_UPDATED: ["แก้ไขสมาชิก", "Member updated"],
  MEMBER_DELETED: ["ลบสมาชิก", "Member deleted"],
  MEMBER_RESTORED: ["กู้คืนสมาชิก", "Member restored"],
  MEMBER_PASSWORD_RESET: ["รีเซ็ตรหัสผ่านสมาชิก", "Member password reset"],
  MEMBER_EMAIL_CHANGED: ["เปลี่ยนอีเมลสมาชิก", "Member email changed"],
  PASSWORD_CHANGED: ["เปลี่ยนรหัสผ่าน", "Password changed"],
  ORGANIZATION_SETUP: ["ตั้งค่าองค์กร", "Organization set up"],
  ORGANIZATION_UPDATED: ["แก้ไของค์กร", "Organization updated"],
  EVIDENCE_UPLOADED: ["อัปโหลดไฟล์หลักฐาน", "Evidence uploaded"],
};

export function getAuditActionLabel(action: string, isThai: boolean) {
  return AUDIT_ACTION_LABELS[action]?.[isThai ? 0 : 1] ?? action;
}

const AUDIT_ENTITY_LABELS: Record<string, [string, string]> = {
  branches: ["สาขา", "Branches"],
  warehouses: ["คลังสินค้า", "Warehouses"],
  suppliers: ["ผู้ขาย", "Suppliers"],
  units: ["หน่วยนับ", "Units"],
  product_groups: ["กลุ่มสินค้า", "Product groups"],
  product_categories: ["หมวดหมู่สินค้า", "Product categories"],
  brands: ["ยี่ห้อ", "Brands"],
  product_models: ["รุ่นสินค้า", "Product models"],
  products: ["สินค้า", "Products"],
  goods_receipts: ["รายการรับสินค้า", "Goods receipts"],
  inventory_documents: ["เอกสารสต็อก", "Inventory documents"],
  purchase_orders: ["ใบสั่งซื้อ", "Purchase orders"],
  supplier_receipts: ["ใบรับจากผู้ขาย", "Supplier receipts"],
  carrier_receipts: ["ใบรับจากขนส่ง", "Carrier receipts"],
  delivery_confirmations: ["การยืนยันส่งถึง", "Delivery confirmations"],
  issue_reports: ["รายงานปัญหา", "Issue reports"],
  claim_tracking: ["บันทึกติดตามเคลม", "Claim tracking"],
  app_users: ["สมาชิก", "Members"],
  organization_settings: ["ข้อมูลองค์กร", "Organization settings"],
  media_assets: ["ไฟล์หลักฐาน", "Evidence files"],
};

export function getAuditEntityTypeLabel(entityType: string, isThai: boolean) {
  return AUDIT_ENTITY_LABELS[entityType]?.[isThai ? 0 : 1] ?? entityType;
}
