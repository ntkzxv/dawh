export type HierarchyType = "ZONE"|"AISLE"|"RACK"|"SHELF"|"BIN";
export type LocationType = "RECEIVING"|"STORAGE"|"PICKING"|"PACKING"|"DISPATCH"|"QUARANTINE"|"DAMAGED"|"RETURN"|"CLAIM_HOLDING";
export type LocationStatus = "ACTIVE"|"BLOCKED"|"MAINTENANCE";
export type LocationInput={parentId:string|null;code:string;name:string;hierarchyType:HierarchyType;locationType:LocationType;maxVolume:string|null;maxWeight:string|null;status:LocationStatus;isActive:boolean};
export type LocationUpdateInput=Partial<LocationInput>&{version:number};
export type LocationDto=LocationInput&{id:string;facilityId:string;facilityCode:string;path:string;depth:number;version:number;createdAt:string;updatedAt:string};
