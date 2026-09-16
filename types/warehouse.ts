export interface ProductItem {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  name_th: string | null;
  category: string;
  description: string | null;
  cost_price: number;
  market_price: number;
  min_stock_alert: number;
  unit: string;
  bay_location: string | null;
  image_url: string | null;
  is_active: boolean;
  total_on_hand?: number;
  total_reserved?: number;
  total_available?: number;
  health_status?: "In Stock" | "Low Stock" | "Out of Stock";
  created_at?: string;
  updated_at?: string;
}

export interface InventoryStockRecord {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  reserved_quantity: number;
  zone: string | null;
  bay_rack: string | null;
  last_restocked_at: string | null;
}

export interface SupplierItem {
  id: string;
  supplier_code: string;
  name: string;
  name_th: string | null;
  category: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  sla_rating: number;
  lead_time_days: number;
  certification_status: string;
  is_active: boolean;
}

export interface StockMovementItem {
  id: string;
  product_id: string;
  from_branch_id: string | null;
  to_branch_id: string | null;
  movement_type: "inbound" | "outbound" | "transfer" | "adjustment" | "qc_reject";
  quantity: number;
  unit_cost: number | null;
  reference_no: string | null;
  note: string | null;
  staff_id: string | null;
  created_at: string;
}

export interface QcInspectionItem {
  id: string;
  qc_code: string;
  product_id: string;
  batch_no: string;
  inspected_quantity: number;
  passed_quantity: number;
  rejected_quantity: number;
  inspector_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}
