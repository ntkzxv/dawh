"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronDown, Copy } from "lucide-react";
import {
  THAI_ADDRESS_DATA,
  getProvinces,
  getDistricts,
  getSubdistricts,
  findAddressItem,
} from "@/data/masterData";
import type { AddressParts } from "../types";

export function translateThaiSoiToEn(val: string): string {
  if (!val) return "";
  let s = val.trim();
  if (s.startsWith("ซอย")) {
    s = s.substring(3).trim();
  } else if (s.startsWith("ซ.")) {
    s = s.substring(2).trim();
  }
  return s ? `Soi ${s}` : "";
}

export function parseDetailAddress(detailStr: string): { houseNo: string; moo: string; soi: string } {
  const result = { houseNo: "", moo: "", soi: "" };
  if (!detailStr) return result;

  let text = detailStr.trim();

  // Check for Soi / ซอย
  const soiMatch = text.match(/(?:Soi|ซอย|ซ\.)\s*(.+)$/i);
  if (soiMatch && soiMatch.index !== undefined) {
    result.soi = soiMatch[1].trim();
    text = text.substring(0, soiMatch.index).trim();
  }

  // Check for Moo / หมู่
  const mooMatch = text.match(/(?:Moo|หมู่ที่|หมู่|ม\.)\s*(\d+[^\s]*)/i);
  if (mooMatch && mooMatch.index !== undefined) {
    result.moo = mooMatch[1].trim();
    const idx = mooMatch.index;
    text = (text.substring(0, idx) + " " + text.substring(idx + mooMatch[0].length)).trim();
  }

  result.houseNo = text.trim();
  return result;
}

export function parseAddressString(addr: string): AddressParts {
  const result: AddressParts = { houseNo: "", moo: "", soi: "", province_en: "", district_en: "", subdistrict_en: "", zipcode: "" };
  if (!addr) return result;

  const rawParts = addr.split(",").map((s) => s.trim());

  // 1. Strict 4-part representation: [detailText, subdistrict_en, district_en, province_en zipcode]
  if (rawParts.length === 4) {
    const detailRaw = rawParts[0];
    result.subdistrict_en = rawParts[1];
    result.district_en = rawParts[2];
    const provZipRaw = rawParts[3];

    if (provZipRaw) {
      const lastSpaceIdx = provZipRaw.lastIndexOf(" ");
      if (lastSpaceIdx !== -1) {
        const potentialZip = provZipRaw.substring(lastSpaceIdx + 1).trim();
        if (/^\d{5}$/.test(potentialZip)) {
          result.zipcode = potentialZip;
          result.province_en = provZipRaw.substring(0, lastSpaceIdx).trim();
        } else {
          result.province_en = provZipRaw.trim();
        }
      } else {
        result.province_en = provZipRaw.trim();
      }
    }

    const detail = parseDetailAddress(detailRaw);
    result.houseNo = detail.houseNo;
    result.moo = detail.moo;
    result.soi = detail.soi;
    return result;
  }

  // 2. Intelligent token / keyword match with master data fallback
  const zipMatch = addr.match(/\b(\d{5})\b/);
  if (zipMatch) {
    result.zipcode = zipMatch[1];
  }

  for (const item of THAI_ADDRESS_DATA) {
    if (rawParts.some((p) => p.toLowerCase() === item.province_en.toLowerCase() || p.includes(item.province_th) || p.startsWith(item.province_en))) {
      result.province_en = item.province_en;
      break;
    }
  }

  if (result.province_en) {
    for (const item of THAI_ADDRESS_DATA) {
      if (item.province_en === result.province_en) {
        if (rawParts.some((p) => p.toLowerCase() === item.district_en.toLowerCase() || p.includes(item.district_th))) {
          result.district_en = item.district_en;
          break;
        }
      }
    }
  }

  if (result.province_en && result.district_en) {
    for (const item of THAI_ADDRESS_DATA) {
      if (item.province_en === result.province_en && item.district_en === result.district_en) {
        if (rawParts.some((p) => p.toLowerCase() === item.subdistrict_en.toLowerCase() || p.includes(item.subdistrict_th))) {
          result.subdistrict_en = item.subdistrict_en;
          if (!result.zipcode) result.zipcode = item.zipcode;
          break;
        }
      }
    }
  }

  const detail = parseDetailAddress(rawParts[0] || "");
  result.houseNo = detail.houseNo;
  result.moo = detail.moo;
  result.soi = detail.soi;

  return result;
}

export function buildEnglishAddress(parts: AddressParts): string {
  const { houseNo, moo, soi, subdistrict_en, district_en, province_en, zipcode } = parts;
  
  const detailParts: string[] = [];
  if (houseNo && houseNo.trim()) detailParts.push(houseNo.trim());
  if (moo && moo.trim()) {
    let m = moo.trim();
    if (m.startsWith("หมู่ที่")) m = m.substring(7).trim();
    else if (m.startsWith("หมู่")) m = m.substring(4).trim();
    else if (m.startsWith("ม.")) m = m.substring(2).trim();
    detailParts.push(`Moo ${m}`);
  }
  if (soi && soi.trim()) {
    detailParts.push(translateThaiSoiToEn(soi));
  }

  const detailText = detailParts.join(" ");
  const provZip = [province_en, zipcode].filter(Boolean).join(" ");
  return [detailText, subdistrict_en || "", district_en || "", provZip || ""].join(", ");
}

export interface ThaiAddressSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isLight: boolean;
  isThai: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  onCopyFromCurrent?: () => void;
  showCopyButton?: boolean;
}

export function ThaiAddressSelector({
  label,
  value,
  onChange,
  isLight,
  isThai,
  isRequired,
  isInvalid,
  onCopyFromCurrent,
  showCopyButton,
}: ThaiAddressSelectorProps) {
  const [prevValue, setPrevValue] = useState(value);
  const parsed = useMemo(() => parseAddressString(value), [value]);
  const [houseNo, setHouseNo] = useState(parsed.houseNo);
  const [moo, setMoo] = useState(parsed.moo || "");
  const [soi, setSoi] = useState(parsed.soi || "");
  const [selectedProvince, setSelectedProvince] = useState(parsed.province_en);
  const [selectedDistrict, setSelectedDistrict] = useState(parsed.district_en);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(parsed.subdistrict_en);
  const [zipcode, setZipcode] = useState(parsed.zipcode);

  // Sync internal state during render when value prop changes externally (e.g. Copy from Current Address)
  if (value !== prevValue) {
    setPrevValue(value);
    const parsedNew = parseAddressString(value);
    setHouseNo(parsedNew.houseNo);
    setMoo(parsedNew.moo || "");
    setSoi(parsedNew.soi || "");
    setSelectedProvince(parsedNew.province_en);
    setSelectedDistrict(parsedNew.district_en);
    setSelectedSubdistrict(parsedNew.subdistrict_en);
    setZipcode(parsedNew.zipcode);
  }

  const [activeField, setActiveField] = useState<"province" | "district" | "subdistrict" | null>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [subdistrictSearch, setSubdistrictSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(() => selectedProvince ? getDistricts(selectedProvince) : [], [selectedProvince]);
  const subdistricts = useMemo(() => selectedProvince && selectedDistrict ? getSubdistricts(selectedProvince, selectedDistrict) : [], [selectedProvince, selectedDistrict]);

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return provinces;
    const q = provinceSearch.toLowerCase();
    return provinces.filter((p) => p.province_th.toLowerCase().includes(q) || p.province_en.toLowerCase().includes(q));
  }, [provinces, provinceSearch]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return districts;
    const q = districtSearch.toLowerCase();
    return districts.filter((d) => d.district_th.toLowerCase().includes(q) || d.district_en.toLowerCase().includes(q));
  }, [districts, districtSearch]);

  const filteredSubdistricts = useMemo(() => {
    if (!subdistrictSearch) return subdistricts;
    const q = subdistrictSearch.toLowerCase();
    return subdistricts.filter((s) => s.subdistrict_th.toLowerCase().includes(q) || s.subdistrict_en.toLowerCase().includes(q));
  }, [subdistricts, subdistrictSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    if (activeField) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [activeField]);

  // Sync houseNo, moo, soi and selections back out as english string whenever parts change
  const pushChange = useCallback((parts: Partial<AddressParts>) => {
    const next: AddressParts = {
      houseNo,
      moo,
      soi,
      province_en: selectedProvince,
      district_en: selectedDistrict,
      subdistrict_en: selectedSubdistrict,
      zipcode,
      ...parts,
    };
    onChange(buildEnglishAddress(next));
  }, [houseNo, moo, soi, selectedProvince, selectedDistrict, selectedSubdistrict, zipcode, onChange]);

  const handleSelectProvince = (p: { province_en: string }) => {
    setSelectedProvince(p.province_en);
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setZipcode("");
    setActiveField(null);
    setProvinceSearch("");
    setHighlightedIndex(0);
    pushChange({ province_en: p.province_en, district_en: "", subdistrict_en: "", zipcode: "" });
  };

  const handleSelectDistrict = (d: { district_en: string }) => {
    setSelectedDistrict(d.district_en);
    setSelectedSubdistrict("");
    setZipcode("");
    setActiveField(null);
    setDistrictSearch("");
    setHighlightedIndex(0);
    pushChange({ district_en: d.district_en, subdistrict_en: "", zipcode: "" });
  };

  const handleSelectSubdistrict = (s: { subdistrict_en: string; zipcode: string }) => {
    setSelectedSubdistrict(s.subdistrict_en);
    setZipcode(s.zipcode);
    setActiveField(null);
    setSubdistrictSearch("");
    setHighlightedIndex(0);
    // Find item to get full province label
    const item = findAddressItem(selectedProvince, selectedDistrict, s.subdistrict_en);
    const prov = item?.province_en || selectedProvince;
    pushChange({ subdistrict_en: s.subdistrict_en, zipcode: s.zipcode, province_en: prov });
  };

  const handleHouseNoChange = (val: string) => {
    setHouseNo(val);
    pushChange({ houseNo: val });
  };

  const handleMooChange = (val: string) => {
    setMoo(val);
    pushChange({ moo: val });
  };

  const handleSoiChange = (val: string) => {
    setSoi(val);
    pushChange({ soi: val });
  };

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (
    e: React.KeyboardEvent,
    listLength: number,
    onSelectCurrent: (index: number) => void
  ) => {
    if (listLength === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % listLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + listLength) % listLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelectCurrent(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveField(null);
    }
  };

  const baseInput = `w-full p-2.5 rounded-lg border text-xs outline-none transition-all ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:bg-white focus:border-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:bg-[#202020] focus:border-white"}`;
  const dropdownClass = `absolute top-full left-0 right-0 mt-1 z-50 max-h-[200px] overflow-y-auto rounded-xl border shadow-2xl flex flex-col p-1 gap-0.5 animate-in fade-in zoom-in-95 duration-150 ${isLight ? "bg-white/97 border-[#E4E4E7] text-[#222222]" : "bg-[#2B2B2B]/97 border-[#444444] text-[#FFFFFF]"}`;
  const optionClass = (sel: boolean, isHigh: boolean) => `w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 cursor-pointer transition-all ${
    sel
      ? (isLight ? "bg-[#222222] text-white font-semibold" : "bg-white text-[#222222] font-semibold")
      : isHigh
      ? (isLight ? "bg-slate-200/80 font-medium" : "bg-[#383838] text-white font-medium")
      : (isLight ? "hover:bg-slate-100" : "hover:bg-[#383838]")
  }`;

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
          {label} {isRequired && "*"}
        </label>
        {showCopyButton && onCopyFromCurrent && (
          <button
            type="button"
            onClick={onCopyFromCurrent}
            className={`text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              isLight
                ? "text-zinc-600 hover:text-black hover:underline"
                : "text-zinc-400 hover:text-white hover:underline"
            }`}
          >
            <Copy
              size={12}
              className={isLight ? "text-zinc-600" : "text-zinc-400"}
            />
            <span>{isThai ? "ใช้ที่อยู่เดียวกับที่อยู่ปัจจุบัน" : "Same as Current Address"}</span>
          </button>
        )}
      </div>

      {/* Row 1: Province + District */}
      <div className="grid grid-cols-2 gap-2">
        {/* Province */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveField((f) => f === "province" ? null : "province")}
            className={`${baseInput} w-full flex items-center justify-between cursor-pointer`}
          >
            <span className={selectedProvince ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedProvince
                ? (isThai ? provinces.find((p) => p.province_en === selectedProvince)?.province_th || selectedProvince : selectedProvince)
                : (isThai ? "จังหวัด *" : "Province *")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "province" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "province" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredProvinces.length, (idx) => {
                      if (filteredProvinces[idx]) handleSelectProvince(filteredProvinces[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาจังหวัด (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search province (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredProvinces.map((p, idx) => (
                <button
                  key={p.province_en}
                  type="button"
                  onClick={() => handleSelectProvince(p)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedProvince === p.province_en, highlightedIndex === idx)}
                >
                  {isThai ? p.province_th : p.province_en}
                </button>
              ))}
              {filteredProvinces.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบจังหวัด" : "No results"}</div>}
            </div>
          )}
        </div>

        {/* District */}
        <div className="relative">
          <button
            type="button"
            disabled={!selectedProvince}
            onClick={() => setActiveField((f) => f === "district" ? null : "district")}
            className={`${baseInput} w-full flex items-center justify-between ${selectedProvince ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          >
            <span className={selectedDistrict ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedDistrict
                ? (isThai ? districts.find((d) => d.district_en === selectedDistrict)?.district_th || selectedDistrict : selectedDistrict)
                : (isThai ? "อำเภอ/เขต" : "District")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "district" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "district" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredDistricts.length, (idx) => {
                      if (filteredDistricts[idx]) handleSelectDistrict(filteredDistricts[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาอำเภอ (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search district (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredDistricts.map((d, idx) => (
                <button
                  key={d.district_en}
                  type="button"
                  onClick={() => handleSelectDistrict(d)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedDistrict === d.district_en, highlightedIndex === idx)}
                >
                  {isThai ? d.district_th : d.district_en}
                </button>
              ))}
              {filteredDistricts.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบอำเภอ" : "No results"}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Subdistrict + Zipcode */}
      <div className="grid grid-cols-2 gap-2">
        {/* Subdistrict */}
        <div className="relative">
          <button
            type="button"
            disabled={!selectedDistrict}
            onClick={() => setActiveField((f) => f === "subdistrict" ? null : "subdistrict")}
            className={`${baseInput} w-full flex items-center justify-between ${selectedDistrict ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          >
            <span className={selectedSubdistrict ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedSubdistrict
                ? (isThai ? subdistricts.find((s) => s.subdistrict_en === selectedSubdistrict)?.subdistrict_th || selectedSubdistrict : selectedSubdistrict)
                : (isThai ? "ตำบล/แขวง" : "Subdistrict")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "subdistrict" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "subdistrict" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={subdistrictSearch}
                  onChange={(e) => setSubdistrictSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredSubdistricts.length, (idx) => {
                      if (filteredSubdistricts[idx]) handleSelectSubdistrict(filteredSubdistricts[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาตำบล (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search subdistrict (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredSubdistricts.map((s, idx) => (
                <button
                  key={`${s.subdistrict_en}-${s.zipcode}`}
                  type="button"
                  onClick={() => handleSelectSubdistrict(s)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedSubdistrict === s.subdistrict_en, highlightedIndex === idx)}
                >
                  <span className="flex-1 text-left">{isThai ? s.subdistrict_th : s.subdistrict_en}</span>
                  <span className={`font-mono text-[10px] shrink-0 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>{s.zipcode}</span>
                </button>
              ))}
              {filteredSubdistricts.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบตำบล" : "No results"}</div>}
            </div>
          )}
        </div>

        {/* Zipcode (auto-filled) */}
        <input
          type="text"
          readOnly
          value={zipcode}
          placeholder={isThai ? "รหัสไปรษณีย์" : "Zipcode"}
          className={`${baseInput} font-mono cursor-default ${isLight ? "bg-[#EFEFEF]" : "bg-[#202020]"}`}
        />
      </div>

      {/* Row 3: 3 Separate Boxes (บ้านเลขที่, เลขหมู่บ้าน, ซอย) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. บ้านเลขที่ (House No.) */}
        <input
          type="text"
          value={houseNo}
          onChange={(e) => handleHouseNoChange(e.target.value)}
          placeholder={isThai ? "บ้านเลขที่" : "House No."}
          className={baseInput}
        />

        {/* 2. เลขหมู่บ้าน (Village / Moo) */}
        <input
          type="text"
          value={moo}
          onChange={(e) => handleMooChange(e.target.value)}
          placeholder={isThai ? "เลขหมู่บ้าน (ถ้ามี)" : "Village / Moo (optional)"}
          className={baseInput}
        />

        {/* 3. ซอย (Soi) */}
        <input
          type="text"
          value={soi}
          onChange={(e) => handleSoiChange(e.target.value)}
          placeholder={isThai ? "ซอย (ถ้ามี)" : "Soi / Alley (optional)"}
          className={baseInput}
        />
      </div>
    </div>
  );
}

export default ThaiAddressSelector;
