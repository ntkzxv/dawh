"use client";

import { useCallback, useState, type FormEvent } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi, type CatalogItem, type CatalogKind } from "@/lib/api/warehouse";
import { button, Empty, Field, input, message, Notice, panel, subtleButton, useRemote } from "./Ui";

const kinds: Array<{ key: CatalogKind; label: string }> = [
  { key: "branches", label: "สาขา" }, { key: "warehouses", label: "คลัง" }, { key: "suppliers", label: "ผู้ขาย" }, { key: "units", label: "หน่วยสินค้า" },
  { key: "product-groups", label: "กลุ่มสินค้า" }, { key: "product-categories", label: "หมวดสินค้า" }, { key: "brands", label: "ยี่ห้อ" }, { key: "product-models", label: "รุ่น" }, { key: "products", label: "สินค้า" },
];
const labels: Record<string, string> = { sku: "รหัสสินค้า", code: "รหัส", name: "ชื่อ", address: "ที่อยู่", contact: "ผู้ติดต่อ", phone: "โทรศัพท์", cost: "ต้นทุน", salePrice: "ราคาขาย", reorderPoint: "จุดสั่งซื้อ", serialTracked: "ติดตาม Serial", branchId: "สาขา", unitId: "หน่วย", groupId: "กลุ่มสินค้า", categoryId: "หมวดสินค้า", brandId: "ยี่ห้อ", modelId: "รุ่น" };
const fields: Record<CatalogKind, string[]> = {
  branches: ["code", "name", "address"], warehouses: ["branchId", "code", "name"], suppliers: ["code", "name", "contact", "phone", "address"], units: ["code", "name"],
  "product-groups": ["name"], "product-categories": ["name", "groupId"], brands: ["name"], "product-models": ["name", "brandId"],
  products: ["sku", "name", "unitId", "groupId", "categoryId", "brandId", "modelId", "serialTracked", "cost", "salePrice", "reorderPoint"],
};
const referenceKind: Record<string, CatalogKind> = { branchId: "branches", unitId: "units", groupId: "product-groups", categoryId: "product-categories", brandId: "brands", modelId: "product-models" };
const toDbKey = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export default function CatalogScreen({ initialKind = "products" }: { initialKind?: CatalogKind }) {
  const [kind, setKind] = useState<CatalogKind>(initialKind);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [me, rows, branches, units, groups, categories, brands, models] = await Promise.all([
      warehouseApi.me(), warehouseApi.catalog(kind), warehouseApi.catalog("branches"), warehouseApi.catalog("units"), warehouseApi.catalog("product-groups"), warehouseApi.catalog("product-categories"), warehouseApi.catalog("brands"), warehouseApi.catalog("product-models"),
    ]);
    return { me, rows, refs: { branches, units, "product-groups": groups, "product-categories": categories, brands, "product-models": models } };
  }, [kind]);
  const { data, loading, error, refresh } = useRemote(load);
  const canEdit = !!data && (["ADMIN", "CEO"].includes(data.me.role) || (data.me.role === "MANAGER" && kind === "warehouses"));
  const save = async (body: Record<string, unknown>) => {
    setFailure(null); setSuccess(null);
    try { if (editing) await warehouseApi.updateCatalog(kind, editing.id, body); else await warehouseApi.createCatalog(kind, body); setSuccess(editing ? "แก้ไขแล้ว" : "เพิ่มข้อมูลแล้ว"); setEditing(null); await refresh(); }
    catch (cause) { setFailure(message(cause)); }
  };
  return <WarehousePageTemplate titleEn="Master data" titleTh="ข้อมูลหลักคลังสินค้า" routePath="/warehouse/inventory" iconName="box">
    <div className="flex flex-wrap gap-2">{kinds.map(({ key, label }) => <button key={key} className={kind === key ? button : subtleButton} onClick={() => { setKind(key); setEditing(null); }}>{label}</button>)}</div>
    {error && <Notice tone="error">{error}</Notice>}{failure && <Notice tone="error">{failure}</Notice>}{success && <Notice tone="success">{success}</Notice>}
    {loading && <p>กำลังโหลดข้อมูล...</p>}
    {data && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><section className={panel}><h2 className="mb-4 text-lg font-bold">{kinds.find((item) => item.key === kind)?.label} ({data.rows.length})</h2>{data.rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 dark:border-white/10"><th className="pb-2">รหัส</th><th>ชื่อ</th><th>สถานะ</th><th></th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id} className="border-b border-slate-100 dark:border-white/10"><td className="py-3 font-mono">{row.sku ?? row.code ?? row.id}</td><td>{row.name}</td><td>{row.active === false ? "ปิดใช้" : "ใช้งาน"}</td><td>{canEdit && <button className="text-indigo-600 underline" onClick={() => setEditing(row)}>แก้ไข</button>}</td></tr>)}</tbody></table></div> : <Empty text="ยังไม่มีข้อมูล เพิ่มรายการแรกจากแบบฟอร์มด้านข้าง" />}</section>{canEdit && <CatalogForm key={`${kind}-${editing?.id ?? "new"}`} kind={kind} current={editing} refs={data.refs} onSave={save} onCancel={() => setEditing(null)} />}</div>}
  </WarehousePageTemplate>;
}

function CatalogForm({ kind, current, refs, onSave, onCancel }: { kind: CatalogKind; current: CatalogItem | null; refs: Record<string, CatalogItem[]>; onSave: (body: Record<string, unknown>) => void; onCancel: () => void }) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(fields[kind].map((key) => [key, current?.[toDbKey(key)] ?? (key === "serialTracked" ? false : "")])) as Record<string, string | boolean>);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body: Record<string, unknown> = {};
    for (const key of fields[kind]) {
      const value = values[key];
      body[key] = key === "serialTracked" ? value === true : referenceKind[key] ? (value ? Number(value) : null) : value === "" && !["sku", "code", "name"].includes(key) ? null : value;
    }
    if (current && "active" in current) body.active = values.active ?? current.active ?? true;
    onSave(body);
  };
  return <form className={`${panel} space-y-3 self-start`} onSubmit={submit}><h2 className="text-lg font-bold">{current ? "แก้ไข" : "เพิ่ม"}{kinds.find((item) => item.key === kind)?.label}</h2>{fields[kind].filter((key) => !(current && key === "branchId")).map((key) => <Field key={key} label={labels[key]}>{key === "serialTracked" ? <input type="checkbox" checked={values[key] === true} onChange={(event) => setValues({ ...values, [key]: event.target.checked })} /> : referenceKind[key] ? <select className={input} required={["unitId", "branchId"].includes(key)} value={String(values[key] ?? "")} onChange={(event) => setValues({ ...values, [key]: event.target.value })}><option value="">เลือก{labels[key]}</option>{refs[referenceKind[key]]?.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.code ?? item.name} · {item.name}</option>)}</select> : <input className={input} required={["sku", "code", "name"].includes(key)} type={["cost", "salePrice", "reorderPoint"].includes(key) ? "number" : "text"} min={key === "reorderPoint" ? "0" : undefined} step={["cost", "salePrice"].includes(key) ? "0.01" : key === "reorderPoint" ? "0.001" : undefined} value={String(values[key] ?? "")} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />}</Field>)}{current && "active" in current && <Field label="สถานะ"><select className={input} value={String(values.active ?? current.active ?? true)} onChange={(event) => setValues({ ...values, active: event.target.value === "true" })}><option value="true">ใช้งาน</option><option value="false">ปิดใช้</option></select></Field>}<div className="flex gap-2"><button className={button}>{current ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}</button>{current && <button type="button" className={subtleButton} onClick={onCancel}>ยกเลิก</button>}</div></form>;
}
