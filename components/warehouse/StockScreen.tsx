"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { Pagination } from "@/components/common";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import {
  warehouseApi,
  type CatalogItem,
  type StockBalance,
  type StockMovement,
} from "@/lib/api/warehouse";
import {
  button,
  Empty,
  Field,
  input,
  message,
  Notice,
  panel,
  subtleButton,
  useRemote,
} from "./Ui";
import { ProductSearchSelect } from "./ProductSearchSelect";
import { canManageStock } from "@/lib/contracts/warehouse-policy";

type Tab = "balances" | "ledger";
const pageSize = 20;

export default function StockScreen({
  initialTab = "balances",
}: {
  initialTab?: Tab;
}) {
  const account = useOptionalWarehouseAccount();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (warehouseFilter) params.set("warehouseId", warehouseFilter);
      const result =
        tab === "balances"
          ? await warehouseApi.balancesPage(params, signal)
          : await warehouseApi.ledgerPage(params, signal);
      return { ...result, tab, warehouseFilter, requestedPage: page };
    },
    [page, tab, warehouseFilter],
  );
  const { data, loading, error, refresh } = useRemote(load);
  const loadWarehouses = useCallback(
    (signal: AbortSignal) => warehouseApi.catalog("warehouses", signal),
    [],
  );
  const { data: warehouses } = useRemote(loadWarehouses);
  const activeData =
    data?.tab === tab &&
    data.warehouseFilter === warehouseFilter &&
    data.requestedPage === page
      ? data
      : null;
  const mayManageStock = canManageStock(account?.me?.role);
  const totalPages = Math.ceil((activeData?.page.total ?? 0) / pageSize);

  useEffect(() => {
    if (!activeData || totalPages < 1 || page <= totalPages) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setPage(totalPages);
    });
    return () => {
      active = false;
    };
  }, [activeData, totalPages, page]);

  const save = async (body: Record<string, unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.createStockDocument(body);
      setSuccess("บันทึกการเคลื่อนไหวแล้ว");
      await refresh();
    } catch (cause) {
      setFailure(message(cause));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reverse = async (documentId: number) => {
    const reason = window.prompt(
      `เหตุผลที่ต้องกลับรายการเอกสาร #${documentId}`,
    );
    if (!reason?.trim()) return;
    setFailure(null);
    setSuccess(null);
    try {
      await warehouseApi.reverseStockDocument(documentId, reason.trim());
      setSuccess("กลับรายการแล้ว");
      await refresh();
    } catch (cause) {
      setFailure(message(cause));
    }
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };
  return (
    <WarehousePageTemplate
      titleEn="Stock"
      titleTh="ยอดและประวัติสต๊อก"
      routePath="/warehouse/stock"
      iconName="layers"
    >
      {busy && <Notice>กำลังบันทึกการเคลื่อนไหว...</Notice>}
      <div className="flex flex-wrap gap-2">
        <button
          className={tab === "balances" ? button : subtleButton}
          onClick={() => changeTab("balances")}
        >
          ยอดคงเหลือ
        </button>
        <button
          className={tab === "ledger" ? button : subtleButton}
          onClick={() => changeTab("ledger")}
        >
          การเคลื่อนไหว
        </button>
        <select
          className={`${input} max-w-64`}
          value={warehouseFilter}
          onChange={(event) => {
            setWarehouseFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">ทุกคลังที่มีสิทธิ์</option>
          {warehouses?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {mayManageStock && (
          <button
            className={subtleButton}
            onClick={() => setFormOpen((open) => !open)}
          >
            {formOpen ? "ปิดฟอร์ม" : "บันทึกการเคลื่อนไหว"}
          </button>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      {(loading || (!activeData && !error)) && <p>กำลังโหลดข้อมูล...</p>}
      {activeData && (
        <div
          className={
            formOpen && mayManageStock
              ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"
              : "grid gap-5"
          }
        >
          <section className={panel}>
            {tab === "balances" ? (
              <BalanceList rows={activeData.items as StockBalance[]} />
            ) : (
              <MovementList
                rows={activeData.items as StockMovement[]}
                canReverse={mayManageStock}
                onReverse={reverse}
              />
            )}
            {(activeData.page.total ?? 0) > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={activeData.page.total ?? 0}
                pageSize={pageSize}
                onPageChange={setPage}
                isThai
                className="mt-5"
              />
            )}
          </section>
          {formOpen && mayManageStock && (
            <StockForm warehouses={warehouses ?? []} onSave={save} />
          )}
        </div>
      )}
    </WarehousePageTemplate>
  );
}

function BalanceList({ rows }: { rows: StockBalance[] }) {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">ยอดคงเหลือ</h2>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2">สินค้า</th>
                <th>สาขา / คลัง</th>
                <th className="text-right">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={`${item.warehouse_id}-${item.product_id}`}
                  className="border-b border-slate-100"
                >
                  <td className="py-3">
                    {item.sku} · {item.product_name}
                  </td>
                  <td>
                    {item.branch_name} / {item.warehouse_name}
                  </td>
                  <td className="text-right font-semibold">
                    {item.quantity} {item.unit_code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="ยังไม่มียอดสต๊อก" />
      )}
    </>
  );
}

function MovementList({
  rows,
  canReverse,
  onReverse,
}: {
  rows: StockMovement[];
  canReverse: boolean;
  onReverse: (id: number) => Promise<void>;
}) {
  return (
    <>
      <h2 className="mb-4 text-lg font-bold">ประวัติเคลื่อนไหว</h2>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap justify-between gap-3 border-b border-slate-100 py-2 text-sm"
            >
              <span>
                {item.sku} · {item.product_name}
                <small className="block text-slate-500">
                  {item.record_no} · {item.warehouse_name} ·{" "}
                  {new Date(item.occurred_at).toLocaleString("th-TH")}
                </small>
              </span>
              <div className="flex items-center gap-2">
                <strong
                  className={
                    Number(item.quantity_delta) >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {Number(item.quantity_delta) > 0 ? "+" : ""}
                  {item.quantity_delta}
                </strong>
                {canReverse && item.kind !== "REVERSAL" && (
                  <button
                    className="text-xs text-rose-600 underline"
                    onClick={() => void onReverse(item.document_id)}
                  >
                    กลับรายการ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="ยังไม่มีรายการเคลื่อนไหว" />
      )}
    </>
  );
}

function StockForm({
  warehouses,
  onSave,
}: {
  warehouses: CatalogItem[];
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [kind, setKind] = useState<"TRANSFER" | "ISSUE" | "ADJUSTMENT">(
    "TRANSFER",
  );
  const [warehouseId, setWarehouseId] = useState("");
  const [destination, setDestination] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [serials, setSerials] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      kind,
      warehouseId: Number(warehouseId),
      ...(kind === "TRANSFER"
        ? { destinationWarehouseId: Number(destination) }
        : {}),
      reason,
      lines: [
        {
          productId: Number(productId),
          ...(kind === "ADJUSTMENT"
            ? { quantityDelta: quantity }
            : { quantity }),
          serialNumbers: serials
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean),
        },
      ],
    });
  };
  return (
    <form className={`${panel} space-y-3 self-start`} onSubmit={submit}>
      <h2 className="text-lg font-bold">บันทึกการเคลื่อนไหว</h2>
      <Field label="ประเภท">
        <select
          className={input}
          value={kind}
          onChange={(event) => setKind(event.target.value as typeof kind)}
        >
          <option value="TRANSFER">โอนระหว่างคลัง</option>
          <option value="ISSUE">จ่ายออก</option>
          <option value="ADJUSTMENT">ปรับยอด</option>
        </select>
      </Field>
      <Field label="คลังต้นทาง">
        <select
          className={input}
          required
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
        >
          <option value="">เลือกคลัง</option>
          {warehouses
            .filter((item) => item.active !== false)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </Field>
      {kind === "TRANSFER" && (
        <Field label="คลังปลายทาง">
          <select
            className={input}
            required
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">เลือกคลัง</option>
            {warehouses
              .filter(
                (item) =>
                  item.active !== false && String(item.id) !== warehouseId,
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </Field>
      )}
      <ProductSearchSelect value={productId} onChange={setProductId} />
      <Field label={kind === "ADJUSTMENT" ? "ผลต่างจำนวน (+/-)" : "จำนวน"}>
        <input
          className={input}
          required
          type="number"
          step="0.001"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </Field>
      <Field label="เหตุผล">
        <textarea
          className={input}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <Field label="Serial (คั่นด้วยจุลภาค หากสินค้าใช้ Serial)">
        <textarea
          className={input}
          value={serials}
          onChange={(event) => setSerials(event.target.value)}
        />
      </Field>
      <button className={button}>บันทึก</button>
    </form>
  );
}
