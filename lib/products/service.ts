import "server-only";
import type { Pool, PoolClient } from "pg";
import { AuthorizationError } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/core/http/errors";
import type {
  Product,
  ProductFilters,
  ProductInput,
  ProductUpdateInput,
} from "@/lib/products/types";
type Ex = Pick<Pool | PoolClient, "query">;
type Row = {
  id: string;
  organization_id: string;
  sku: string;
  name_th: string;
  name_en: string | null;
  description: string | null;
  category_id: string | null;
  category_code: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_code: string | null;
  brand_name: string | null;
  base_unit_id: string;
  base_unit_code: string;
  base_unit_name: string;
  tracking_method: Product["trackingMethod"];
  picking_strategy: Product["pickingStrategy"];
  weight_kg: string | null;
  length_cm: string | null;
  width_cm: string | null;
  height_cm: string | null;
  standard_cost: string | null;
  currency_code: string;
  shelf_life_days: number | null;
  storage_condition: string | null;
  is_active: boolean;
  version: number;
  units: Product["units"];
  barcodes: Product["barcodes"];
  created_at: Date;
  updated_at: Date;
};
const select = `SELECT p.id,p.organization_id,p.sku,p.name_th,p.name_en,p.description,p.category_id,c.code category_code,c.name category_name,p.brand_id,b.code brand_code,b.name brand_name,p.base_unit_id,u.code base_unit_code,u.name base_unit_name,p.tracking_method,p.picking_strategy,p.weight_kg::text,p.length_cm::text,p.width_cm::text,p.height_cm::text,p.standard_cost::text,trim(p.currency_code) currency_code,p.shelf_life_days,p.storage_condition,p.is_active,p.version,p.created_at,p.updated_at,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',pu.id::text,'unitId',pu.unit_id::text,'unitCode',uu.code,'baseQuantity',pu.base_quantity::text,'isActive',pu.is_active,'version',pu.version)ORDER BY uu.code)FROM public.product_units pu JOIN public.units_of_measure uu ON uu.id=pu.unit_id WHERE pu.product_id=p.id),'[]'::jsonb)units,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',pb.id::text,'productUnitId',pb.product_unit_id::text,'barcode',pb.barcode,'barcodeType',pb.barcode_type,'isPrimary',pb.is_primary)ORDER BY pb.is_primary DESC,pb.barcode)FROM public.product_barcodes pb WHERE pb.product_id=p.id),'[]'::jsonb)barcodes FROM public.products p LEFT JOIN public.product_categories c ON c.id=p.category_id LEFT JOIN public.brands b ON b.id=p.brand_id JOIN public.units_of_measure u ON u.id=p.base_unit_id`;
function map(r: Row): Product {
  return {
    id: r.id,
    organizationId: r.organization_id,
    sku: r.sku,
    nameTh: r.name_th,
    nameEn: r.name_en,
    description: r.description,
    category:
      r.category_id && r.category_code && r.category_name
        ? { id: r.category_id, code: r.category_code, name: r.category_name }
        : null,
    brand:
      r.brand_id && r.brand_code && r.brand_name
        ? { id: r.brand_id, code: r.brand_code, name: r.brand_name }
        : null,
    baseUnit: {
      id: r.base_unit_id,
      code: r.base_unit_code,
      name: r.base_unit_name,
    },
    trackingMethod: r.tracking_method,
    pickingStrategy: r.picking_strategy,
    weightKg: r.weight_kg,
    lengthCm: r.length_cm,
    widthCm: r.width_cm,
    heightCm: r.height_cm,
    standardCost: r.standard_cost,
    currencyCode: r.currency_code,
    shelfLifeDays: r.shelf_life_days,
    storageCondition: r.storage_condition,
    isActive: r.is_active,
    version: r.version,
    units: r.units,
    barcodes: r.barcodes,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}
function read(c: AccessContext) {
  if (
    !c.permissions.includes("product.read") &&
    !c.permissions.includes("admin.products.read")
  )
    throw new AuthorizationError();
}
function manage(c: AccessContext) {
  if (!c.permissions.includes("admin.products.manage"))
    throw new AuthorizationError();
}
function dup(e: unknown): never {
  if ((e as { code?: string }).code === "23505")
    throw new ConflictError(
      "CONFLICT",
      "The SKU already exists in this organization.",
    );
  throw e;
}
async function refs(x: PoolClient, c: AccessContext, i: ProductInput) {
  const unit = await x.query(
    `SELECT 1 FROM public.units_of_measure WHERE id=$1 AND organization_id=$2 AND is_active`,
    [i.baseUnitId, c.organization.id],
  );
  if (!unit.rowCount) throw new NotFoundError("Base unit");
  if (i.categoryId) {
    const r = await x.query(
      `SELECT 1 FROM public.product_categories WHERE id=$1 AND organization_id=$2 AND is_active`,
      [i.categoryId, c.organization.id],
    );
    if (!r.rowCount) throw new NotFoundError("Product category");
  }
  if (i.brandId) {
    const r = await x.query(
      `SELECT 1 FROM public.brands WHERE id=$1 AND organization_id=$2 AND is_active`,
      [i.brandId, c.organization.id],
    );
    if (!r.rowCount) throw new NotFoundError("Brand");
  }
  if (
    i.pickingStrategy === "FEFO" &&
    (i.trackingMethod !== "LOT" || !i.shelfLifeDays)
  )
    throw new ValidationError({
      pickingStrategy: "FEFO requires LOT tracking and a positive shelf life.",
    });
}
export async function listProducts(c: AccessContext, f: ProductFilters) {
  read(c);
  const r = await dbPool.query<Row>(
    `${select} WHERE p.organization_id=$1 AND ($2::text IS NULL OR p.sku ILIKE '%'||$2||'%' ESCAPE '\\' OR p.name_th ILIKE '%'||$2||'%' ESCAPE '\\' OR p.name_en ILIKE '%'||$2||'%' ESCAPE '\\')AND($3::bigint IS NULL OR p.category_id=$3)AND($4::bigint IS NULL OR p.brand_id=$4)AND($5::text IS NULL OR p.tracking_method=$5)AND($6::boolean IS NULL OR p.is_active=$6)AND($7::timestamptz IS NULL OR(p.created_at,p.id)<($7,$8::bigint))ORDER BY p.created_at DESC,p.id DESC LIMIT $9`,
    [
      c.organization.id,
      f.search,
      f.categoryId,
      f.brandId,
      f.trackingMethod,
      f.active,
      f.page.cursor?.timestamp ?? null,
      f.page.cursor?.id ?? null,
      f.page.limit + 1,
    ],
  );
  return r.rows.map(map);
}
export async function getProduct(c: AccessContext, id: string, x: Ex = dbPool) {
  read(c);
  const r = await x.query<Row>(
    `${select} WHERE p.id=$1 AND p.organization_id=$2`,
    [id, c.organization.id],
  );
  if (!r.rows[0]) throw new NotFoundError("Product");
  return map(r.rows[0]);
}
export async function createProduct(
  c: AccessContext,
  rc: RequestContext,
  i: ProductInput,
) {
  manage(c);
  try {
    return await withTransaction(async (x) => {
      await refs(x, c, i);
      const id = (
        await x.query<{ id: string }>(
          `INSERT INTO public.products(organization_id,sku,name_th,name_en,description,category_id,brand_id,base_unit_id,tracking_method,picking_strategy,weight_kg,length_cm,width_cm,height_cm,standard_cost,currency_code,shelf_life_days,storage_condition,is_active,created_by,updated_by)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::numeric,$12::numeric,$13::numeric,$14::numeric,$15::numeric,$16,$17,$18,$19,$20,$20)RETURNING id`,
          [
            c.organization.id,
            i.sku,
            i.nameTh,
            i.nameEn,
            i.description,
            i.categoryId,
            i.brandId,
            i.baseUnitId,
            i.trackingMethod,
            i.pickingStrategy,
            i.weightKg,
            i.lengthCm,
            i.widthCm,
            i.heightCm,
            i.standardCost,
            i.currencyCode,
            i.shelfLifeDays,
            i.storageCondition,
            i.isActive,
            c.user.id,
          ],
        )
      ).rows[0].id;
      const dto = await getProduct(c, id, x);
      await writeAuditLog(x, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "product.created",
        entityType: "product",
        entityId: id,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return dup(e);
  }
}
export async function updateProduct(
  c: AccessContext,
  rc: RequestContext,
  id: string,
  i: ProductUpdateInput,
) {
  manage(c);
  try {
    return await withTransaction(async (x) => {
      const old = await getProduct(c, id, x);
      const m: ProductInput = {
        sku: i.sku ?? old.sku,
        nameTh: i.nameTh ?? old.nameTh,
        nameEn: i.nameEn === undefined ? old.nameEn : i.nameEn,
        description:
          i.description === undefined ? old.description : i.description,
        categoryId:
          i.categoryId === undefined
            ? (old.category?.id ?? null)
            : i.categoryId,
        brandId: i.brandId === undefined ? (old.brand?.id ?? null) : i.brandId,
        baseUnitId: i.baseUnitId ?? old.baseUnit.id,
        trackingMethod: i.trackingMethod ?? old.trackingMethod,
        pickingStrategy: i.pickingStrategy ?? old.pickingStrategy,
        weightKg: i.weightKg === undefined ? old.weightKg : i.weightKg,
        lengthCm: i.lengthCm === undefined ? old.lengthCm : i.lengthCm,
        widthCm: i.widthCm === undefined ? old.widthCm : i.widthCm,
        heightCm: i.heightCm === undefined ? old.heightCm : i.heightCm,
        standardCost:
          i.standardCost === undefined ? old.standardCost : i.standardCost,
        currencyCode: i.currencyCode ?? old.currencyCode,
        shelfLifeDays:
          i.shelfLifeDays === undefined ? old.shelfLifeDays : i.shelfLifeDays,
        storageCondition:
          i.storageCondition === undefined
            ? old.storageCondition
            : i.storageCondition,
        isActive: i.isActive ?? old.isActive,
      };
      await refs(x, c, m);
      const r = await x.query(
        `UPDATE public.products SET sku=$3,name_th=$4,name_en=$5,description=$6,category_id=$7,brand_id=$8,base_unit_id=$9,tracking_method=$10,picking_strategy=$11,weight_kg=$12::numeric,length_cm=$13::numeric,width_cm=$14::numeric,height_cm=$15::numeric,standard_cost=$16::numeric,currency_code=$17,shelf_life_days=$18,storage_condition=$19,is_active=$20,version=version+1,updated_by=$21 WHERE id=$1 AND organization_id=$2 AND version=$22 RETURNING id`,
        [
          id,
          c.organization.id,
          m.sku,
          m.nameTh,
          m.nameEn,
          m.description,
          m.categoryId,
          m.brandId,
          m.baseUnitId,
          m.trackingMethod,
          m.pickingStrategy,
          m.weightKg,
          m.lengthCm,
          m.widthCm,
          m.heightCm,
          m.standardCost,
          m.currencyCode,
          m.shelfLifeDays,
          m.storageCondition,
          m.isActive,
          c.user.id,
          i.version,
        ],
      );
      if (!r.rowCount)
        throw new ConflictError(
          "VERSION_CONFLICT",
          "The product was updated by another request.",
        );
      const dto = await getProduct(c, id, x);
      await writeAuditLog(x, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "product.updated",
        entityType: "product",
        entityId: id,
        oldData: old,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return dup(e);
  }
}
