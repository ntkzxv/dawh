"use client";

import { useCallback, useState } from "react";
import { EllipsisVertical, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import SidePanel from "@/components/common/SidePanel";
import CustomerForm from "@/components/sales/CustomerForm";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { LoadMore, TableFrame, Toolbar } from "@/components/sales/SalesUi";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { Notice } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { salesApi, type Customer } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

export default function CustomersPage() {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => salesApi.customersPage(cursor, query, signal),
    [query],
  );
  const { items, page, loading, loadingMore, error, refresh, loadMore } = useCursorResource(load);

  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: isThai ? "ชื่อ" : "Name", render: (row) => row.full_name },
    { key: "phone", header: isThai ? "เบอร์โทร" : "Phone", className: "font-mono", render: (row) => row.phone },
    { key: "citizen", header: isThai ? "เลขบัตรประชาชน" : "Citizen ID", className: "font-mono", render: (row) => row.citizen_id ?? "-" },
    { key: "address", header: isThai ? "ที่อยู่" : "Address", render: (row) => row.address ?? "-" },
    {
      key: "actions",
      header: null,
      headerClassName: "w-[88px]",
      align: "right",
      render: (row) => (
        <button
          type="button"
          aria-label={isThai ? `แก้ไขลูกค้า ${row.full_name}` : `Edit customer ${row.full_name}`}
          title={isThai ? "แก้ไข" : "Edit"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={() => setEditing(row)}
        >
          <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
        </button>
      ),
    },
  ];

  const closeForm = () => setEditing(null);
  return (
    <SalesPageFrame titleEn="Customers" titleTh="ลูกค้า">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar
        actions={
          <Button variant="primary" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setEditing("new")}>
            {isThai ? "เพิ่มลูกค้า" : "Add customer"}
          </Button>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={isThai ? "ค้นหาชื่อ เบอร์โทร หรือเลขบัตร" : "Search name, phone or citizen ID"}
          aria-label={isThai ? "ค้นหาลูกค้า" : "Search customers"}
          clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"}
          width="w-full sm:w-72"
        />
      </Toolbar>

      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          emptyIcon={<UserRound size={34} />}
          emptyTitle={isThai ? "ไม่พบลูกค้า" : "No customers found."}
          minWidth="800px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />

      {editing && (
        <SidePanel
          item={null}
          onClose={closeForm}
          eyebrow={editing === "new" ? (isThai ? "สร้างข้อมูลใหม่" : "New customer") : (isThai ? "จัดการข้อมูล" : "Manage customer")}
          title={editing === "new" ? (isThai ? "เพิ่มลูกค้า" : "Add customer") : (isThai ? "แก้ไขลูกค้า" : "Edit customer")}
        >
          <CustomerForm
            customer={editing === "new" ? undefined : editing}
            onCancel={closeForm}
            onSaved={() => { closeForm(); void refresh(); }}
          />
        </SidePanel>
      )}
    </SalesPageFrame>
  );
}
