"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import CustomDropdown, { DropdownOption } from "./CustomDropdown";

export interface FilterDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: "left" | "right";
}

export function FilterDropdown<T = string>({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  triggerClassName = "",
  disabled = false,
  searchable = false,
  searchPlaceholder,
  align = "left",
}: FilterDropdownProps<T>) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const defaultTriggerClasses = `!h-[33px] !px-3 !py-2 !rounded-[6px] !border !text-[13px] !font-normal !transition-colors ${
    isLight
      ? "!bg-white !border-[#E4E4E7] !text-[#222222] hover:!bg-slate-100"
      : "!bg-[#383838] !border-[#444444] !text-[#F8FAFC] hover:!bg-[#444444]"
  }`;

  return (
    <CustomDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      triggerClassName={`${defaultTriggerClasses} ${triggerClassName}`}
      disabled={disabled}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      align={align}
      size="sm"
    />
  );
}

export default FilterDropdown;
