"use client";

import { useCallback, useEffect, useState } from "react";
import { warehouseApi } from "@/lib/api/warehouse";
import CustomDropdown from "@/components/common/CustomDropdown";
import { Loader2 } from "lucide-react";
import { Field, input, useRemote } from "./Ui";

export function ProductSearchSelect({
  value,
  onChange,
  label = "สินค้า",
  isThai = true,
  useCommonDropdown = false,
  invalid = false,
  dropdownTriggerClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  isThai?: boolean;
  useCommonDropdown?: boolean;
  invalid?: boolean;
  dropdownTriggerClassName?: string;
}) {
  const [typed, setTyped] = useState("");
  const [activated, setActivated] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(typed.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [typed]);
  const load = useCallback(
    async (signal: AbortSignal) => ({
      query,
      items: await warehouseApi.searchProducts(query, signal),
    }),
    [query],
  );
  const { data, loading, error } = useRemote(load, { enabled: activated });
  const items = data?.query === query ? data.items : null;
  const selectedIsListed =
    items?.some((item) => String(item.id) === value) ?? false;
  const productOptions = [
    ...(value && !selectedIsListed
      ? [{ value, label: selectedLabel || `${isThai ? "สินค้า" : "Product"} #${value}` }]
      : []),
    ...(items ?? []).map((item) => ({ value: String(item.id), label: `${item.sku} · ${item.name}` })),
  ];

  return (
    <Field label={label}>
      <div className="space-y-2">
        <input
          className={input}
          type="search"
          value={typed}
          onFocus={() => setActivated(true)}
          onChange={(event) => {
            setActivated(true);
            setTyped(event.target.value);
          }}
          placeholder={isThai ? "ค้นหา SKU หรือชื่อสินค้า" : "Search SKU or product name"}
        />
        {useCommonDropdown ? (
          <CustomDropdown
            value={value}
            onChange={(nextValue) => {
              onChange(nextValue);
              setSelectedLabel(productOptions.find((item) => item.value === nextValue)?.label ?? "");
            }}
            options={productOptions}
            placeholder={isThai ? "ค้นหาก่อนเลือก" : "Search before selecting"}
            className="w-full"
            triggerClassName={dropdownTriggerClassName}
            aria-invalid={invalid}
            icon={loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : undefined}
          />
        ) : (
        <select
          className={input}
          required
          value={value}
          onFocus={() => setActivated(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setSelectedLabel(
              event.target.selectedOptions[0]?.textContent ?? "",
            );
          }}
        >
          <option value="">
            {!activated
              ? (isThai ? "ค้นหาก่อนเลือก" : "Search before selecting")
              : loading
                ? (isThai ? "กำลังค้นหา..." : "Searching...")
                : (isThai ? "เลือกสินค้า" : "Select product")}
          </option>
          {value && !selectedIsListed && (
            <option value={value}>{selectedLabel || `${isThai ? "สินค้า" : "Product"} #${value}`}</option>
          )}
          {items?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} · {item.name}
            </option>
          ))}
        </select>
        )}
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>
    </Field>
  );
}
