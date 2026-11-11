"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { UserRound } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { LoadMore, TableFrame, Toolbar } from "@/components/sales/SalesUi";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { Notice } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { salesApi, type Customer } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

export default function ArCustomersPage() {
  const isThai = useAppLanguage() === "TH";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const load = useCallback((cursor: string | null, signal: AbortSignal) => salesApi.customersPage(cursor, query, signal), [query]);
  const { items, page, loading, loadingMore, error, loadMore } = useCursorResource(load);
  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: isThai ? "ชื่อ" : "Name", render: (row) => row.full_name },
    { key: "phone", header: isThai ? "เบอร์โทร" : "Phone", className: "font-mono", render: (row) => row.phone },
    { key: "citizen", header: isThai ? "เลขบัตรประชาชน" : "Citizen ID", className: "font-mono", render: (row) => row.citizen_id ?? "-" },
    { key: "address", header: isThai ? "ที่อยู่" : "Address", render: (row) => row.address ?? "-" },
  ];
  return (
    <SalesPageFrame titleEn="Customer registry" titleTh="ทะเบียนลูกค้า">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder={isThai ? "ค้นหาชื่อ เบอร์โทร หรือเลขบัตร" : "Search name, phone or citizen ID"} aria-label={isThai ? "ค้นหาลูกค้า" : "Search customers"} clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"} width="w-full sm:w-72" />
      </Toolbar>
      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/sales/ar/customers/${row.id}`)}
          emptyIcon={<UserRound size={34} />}
          emptyTitle={isThai ? "ไม่พบลูกค้า" : "No customers found."}
          minWidth="800px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
    </SalesPageFrame>
  );
}
