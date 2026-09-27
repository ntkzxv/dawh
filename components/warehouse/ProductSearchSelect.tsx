"use client";

import { useCallback, useEffect, useState } from "react";
import { warehouseApi } from "@/lib/api/warehouse";
import { Field, input, useRemote } from "./Ui";

export function ProductSearchSelect({
  value,
  onChange,
  label = "สินค้า",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
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
          placeholder="ค้นหา SKU หรือชื่อสินค้า"
        />
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
              ? "ค้นหาก่อนเลือก"
              : loading
                ? "กำลังค้นหา..."
                : "เลือกสินค้า"}
          </option>
          {value && !selectedIsListed && (
            <option value={value}>{selectedLabel || `สินค้า #${value}`}</option>
          )}
          {items?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} · {item.name}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>
    </Field>
  );
}
