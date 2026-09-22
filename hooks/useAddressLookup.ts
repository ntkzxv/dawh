"use client";

import { useState, useMemo, useCallback } from "react";
import type { AddressInput } from "@/types";
import {
  getProvinces,
  getDistricts,
  getSubdistricts,
  type ProvinceOption,
  type DistrictOption,
  type SubdistrictOption,
} from "@/data/masterData";

export interface UseAddressLookupReturn {
  address: AddressInput;
  provinces: ProvinceOption[];
  districts: DistrictOption[];
  subdistricts: SubdistrictOption[];
  setField: (field: keyof AddressInput, value: string | null) => void;
  setProvince: (provinceEn: string) => void;
  setDistrict: (districtEn: string) => void;
  setSubdistrict: (subdistrictEn: string) => void;
  setAddress: (addr: AddressInput) => void;
  reset: () => void;
}

const emptyAddress: AddressInput = {
  houseNo: "",
  village: null,
  soi: null,
  province: "",
  district: "",
  subdistrict: "",
  postalCode: "",
};

export function useAddressLookup(initialAddress?: Partial<AddressInput>): UseAddressLookupReturn {
  const [address, setAddressState] = useState<AddressInput>({
    ...emptyAddress,
    ...initialAddress,
  });

  const provinces = useMemo(() => getProvinces(), []);

  const districts = useMemo(() => {
    if (!address.province) return [];
    return getDistricts(address.province);
  }, [address.province]);

  const subdistricts = useMemo(() => {
    if (!address.province || !address.district) return [];
    return getSubdistricts(address.province, address.district);
  }, [address.province, address.district]);

  const setField = useCallback((field: keyof AddressInput, value: string | null) => {
    setAddressState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setProvince = useCallback((provinceEn: string) => {
    setAddressState((prev) => ({
      ...prev,
      province: provinceEn,
      district: "",
      subdistrict: "",
      postalCode: "",
    }));
  }, []);

  const setDistrict = useCallback((districtEn: string) => {
    setAddressState((prev) => ({
      ...prev,
      district: districtEn,
      subdistrict: "",
      postalCode: "",
    }));
  }, []);

  const setSubdistrict = useCallback(
    (subdistrictEn: string) => {
      const match = subdistricts.find(
        (s) => s.subdistrict_en.toLowerCase() === subdistrictEn.toLowerCase(),
      );
      setAddressState((prev) => ({
        ...prev,
        subdistrict: subdistrictEn,
        postalCode: match ? match.zipcode : prev.postalCode,
      }));
    },
    [subdistricts],
  );

  const setAddress = useCallback((addr: AddressInput) => {
    setAddressState(addr);
  }, []);

  const reset = useCallback(() => {
    setAddressState(emptyAddress);
  }, []);

  return {
    address,
    provinces,
    districts,
    subdistricts,
    setField,
    setProvince,
    setDistrict,
    setSubdistrict,
    setAddress,
    reset,
  };
}
