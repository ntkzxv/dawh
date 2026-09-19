import "server-only";
import type { Pool, PoolClient } from "pg";
import { AuthorizationError, canAccessFacility, visibleFacilityIds } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";
import type { KeysetCursor } from "@/lib/core/http/pagination";
import type { Facility, FacilityFilters, FacilityInput, FacilityUpdateInput } from "@/lib/facilities/types";

type Executor = Pick<Pool | PoolClient, "query">;
type Row = { id:string;organization_id:string;organization_code:string;code:string;name:string;facility_type:Facility["facilityType"];address_line_1:string|null;address_line_2:string|null;province:string|null;district:string|null;subdistrict:string|null;postal_code:string|null;latitude:string|null;longitude:string|null;is_active:boolean;version:number;created_at:Date;updated_at:Date };
const select = `SELECT f.id,f.organization_id,o.code organization_code,f.code,f.name,f.facility_type,f.address_line_1,f.address_line_2,
 f.province,f.district,f.subdistrict,f.postal_code,f.latitude::text,f.longitude::text,f.is_active,f.version,f.created_at,f.updated_at
 FROM public.facilities f JOIN public.organizations o ON o.id=f.organization_id`;
function map(r:Row):Facility{return{id:r.id,organizationId:r.organization_id,organizationCode:r.organization_code,code:r.code,name:r.name,facilityType:r.facility_type,addressLine1:r.address_line_1,addressLine2:r.address_line_2,province:r.province,district:r.district,subdistrict:r.subdistrict,postalCode:r.postal_code,latitude:r.latitude,longitude:r.longitude,isActive:r.is_active,version:r.version,createdAt:r.created_at.toISOString(),updatedAt:r.updated_at.toISOString()}};

export async function listVisibleFacilities(context:AccessContext,page:{limit:number;cursor:KeysetCursor|null},filters:FacilityFilters={search:null,facilityType:null,active:null}):Promise<Facility[]>{
 const ids=visibleFacilityIds(context);const global=context.permissions.includes("admin.facilities.read")||ids===null;
 if(!global&&ids?.length===0)return[];
 const r=await dbPool.query<Row>(`${select} WHERE f.organization_id=$1 AND ($2::boolean OR f.id=ANY($3::bigint[]))
 AND ($4::text IS NULL OR f.code ILIKE '%'||$4||'%' OR f.name ILIKE '%'||$4||'%') AND ($5::text IS NULL OR f.facility_type=$5)
 AND ($6::boolean IS NULL OR f.is_active=$6) AND ($7::timestamptz IS NULL OR (f.created_at,f.id)<($7::timestamptz,$8::bigint))
 ORDER BY f.created_at DESC,f.id DESC LIMIT $9`,[context.organization.id,global,ids??[],filters.search,filters.facilityType,filters.active,page.cursor?.timestamp??null,page.cursor?.id??null,page.limit+1]);
 return r.rows.map(map);
}
export async function getFacility(context:AccessContext,facilityId:string,executor:Executor=dbPool){
 const r=await executor.query<Row>(`${select} WHERE f.id=$1 AND f.organization_id=$2`,[facilityId,context.organization.id]);
 if(!r.rows[0])throw new NotFoundError("Facility");
 if(!context.permissions.includes("admin.facilities.read")&&!canAccessFacility(context,facilityId,"READ"))throw new AuthorizationError("FORBIDDEN_FACILITY_SCOPE");
 return map(r.rows[0]);
}
function duplicate(error:unknown):never{if((error as {code?:string}).code==="23505")throw new ConflictError("CONFLICT","The facility code already exists.");throw error;}
export async function createFacility(context:AccessContext,rc:RequestContext,input:FacilityInput){
 if(!context.permissions.includes("admin.facilities.manage"))throw new AuthorizationError();
 try{return await withTransaction(async client=>{const r=await client.query<Row>(`WITH c AS (INSERT INTO public.facilities(organization_id,code,name,facility_type,address_line_1,address_line_2,province,district,subdistrict,postal_code,latitude,longitude,is_active,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::numeric,$12::numeric,$13,$14,$14) RETURNING *) SELECT c.id,c.organization_id,o.code organization_code,c.code,c.name,c.facility_type,c.address_line_1,c.address_line_2,c.province,c.district,c.subdistrict,c.postal_code,c.latitude::text,c.longitude::text,c.is_active,c.version,c.created_at,c.updated_at FROM c JOIN public.organizations o ON o.id=c.organization_id`,[context.organization.id,input.code,input.name,input.facilityType,input.addressLine1,input.addressLine2,input.province,input.district,input.subdistrict,input.postalCode,input.latitude,input.longitude,input.isActive,context.user.id]);const dto=map(r.rows[0]);await writeAuditLog(client,{organizationId:context.organization.id,requestId:rc.requestId,actorUserId:context.user.id,action:"facility.created",entityType:"facility",entityId:dto.id,facilityId:dto.id,newData:dto,ipAddress:rc.ipAddress,userAgent:rc.userAgent});return dto;});}catch(error){return duplicate(error);}
}
export async function updateFacility(context:AccessContext,rc:RequestContext,facilityId:string,input:FacilityUpdateInput){
 if(!context.permissions.includes("admin.facilities.manage"))throw new AuthorizationError();
 try{return await withTransaction(async client=>{const before=await getFacility(context,facilityId,client);const m={...before,...input};const r=await client.query<Row>(`WITH c AS (UPDATE public.facilities SET code=$3,name=$4,facility_type=$5,address_line_1=$6,address_line_2=$7,province=$8,district=$9,subdistrict=$10,postal_code=$11,latitude=$12::numeric,longitude=$13::numeric,is_active=$14,version=version+1,updated_by=$15 WHERE id=$1 AND organization_id=$2 AND version=$16 RETURNING *) SELECT c.id,c.organization_id,o.code organization_code,c.code,c.name,c.facility_type,c.address_line_1,c.address_line_2,c.province,c.district,c.subdistrict,c.postal_code,c.latitude::text,c.longitude::text,c.is_active,c.version,c.created_at,c.updated_at FROM c JOIN public.organizations o ON o.id=c.organization_id`,[facilityId,context.organization.id,m.code,m.name,m.facilityType,m.addressLine1,m.addressLine2,m.province,m.district,m.subdistrict,m.postalCode,m.latitude,m.longitude,m.isActive,context.user.id,input.version]);if(!r.rows[0])throw new ConflictError("VERSION_CONFLICT","The facility was updated by another request.");const dto=map(r.rows[0]);await writeAuditLog(client,{organizationId:context.organization.id,requestId:rc.requestId,actorUserId:context.user.id,action:"facility.updated",entityType:"facility",entityId:dto.id,facilityId:dto.id,oldData:before,newData:dto,ipAddress:rc.ipAddress,userAgent:rc.userAgent});return dto;});}catch(error){return duplicate(error);}
}
