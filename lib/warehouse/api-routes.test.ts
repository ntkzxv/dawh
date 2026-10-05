import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, ValidationError } from "@/lib/core/http/errors";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(), post: vi.fn(), reverse: vi.fn(), po: vi.fn(), carrier: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/warehouse/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/warehouse/core")>(),
  getActor: mocks.actor,
}));
vi.mock("@/lib/core/http/request-timing", () => ({
  withApiTiming: (_request: Request, work: () => Promise<Response>) => work(),
  timedPoolQuery: vi.fn(),
}));
vi.mock("@/lib/warehouse/stock-documents", () => ({
  postStockDocument: mocks.post, reverseStockDocument: mocks.reverse,
}));
vi.mock("@/lib/warehouse/purchase-orders", () => ({
  getPurchaseOrder: mocks.po, updatePurchaseOrder: vi.fn(),
}));
vi.mock("@/lib/warehouse/carrier-receipts", () => ({
  getCarrierReceipt: mocks.carrier, updateCarrierReceipt: vi.fn(),
}));

import { POST as post } from "@/app/api/stock/documents/route";
import { POST as reverse } from "@/app/api/stock/documents/[documentId]/reverse/route";
import { GET as getPo } from "@/app/api/purchase-orders/[poId]/route";
import { GET as getCarrier } from "@/app/api/carrier-receipts/[receiptId]/route";

const actor = { id: 1, role: "MANAGER", branchIds: [7] };
function request(path: string, body: string, key?: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST", body,
    headers: { "content-type": "application/json", "x-request-id": "test-request", ...(key ? { "Idempotency-Key": key } : {}) },
  });
}
const context = (documentId = "12") => ({ params: Promise.resolve({ documentId }) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue(actor);
  mocks.post.mockResolvedValue({ inventoryDocumentId: 12, destinationDocumentId: null, repeated: false });
  mocks.reverse.mockResolvedValue({ reversalDocumentIds: [13] });
  mocks.po.mockResolvedValue({ id: 12, lines: [] });
  mocks.carrier.mockResolvedValue({ id: 12, confirmation: null });
});

describe("stock HTTP entry points", () => {
  it("passes the authenticated actor, body and idempotency key to the existing posting service", async () => {
    const body = { kind: "ISSUE", warehouseId: 7, reason: "Usage", lines: [{ productId: 3, quantity: "2" }] };
    const response = await post(request("/api/stock/documents", JSON.stringify(body), "movement-key-123"), undefined);
    expect(response.status).toBe(201);
    expect(mocks.post).toHaveBeenCalledWith(actor, body, "movement-key-123");
    expect(await response.json()).toEqual({
      data: { inventoryDocumentId: 12, destinationDocumentId: null, repeated: false }, meta: { requestId: "test-request" },
    });
    expect(response.headers.get("x-request-id")).toBe("test-request");
  });

  it("preserves the service replay response", async () => {
    mocks.post.mockResolvedValue({ inventoryDocumentId: 12, repeated: true });
    const response = await post(request("/api/stock/documents", "{}", "movement-key-123"), undefined);
    expect((await response.json()).data).toEqual({ inventoryDocumentId: 12, repeated: true });
  });

  it("leaves missing-key validation to the existing service", async () => {
    mocks.post.mockRejectedValue(new ValidationError({ idempotencyKey: "Required" }));
    const response = await post(request("/api/stock/documents", "{}"), undefined);
    expect(mocks.post).toHaveBeenCalledWith(actor, {}, "");
    expect(response.status).toBe(400);
  });

  it("delegates reversal with the numeric document ID and reason", async () => {
    const response = await reverse(request("/api/stock/documents/12/reverse", '{"reason":"Correction"}'), context());
    expect(response.status).toBe(200);
    expect(mocks.reverse).toHaveBeenCalledWith(actor, 12, "Correction");
  });

  it.each(["broken", "[]", "null"])("rejects invalid JSON object %s before either write service", async (body) => {
    expect((await post(request("/api/stock/documents", body), undefined)).status).toBe(400);
    expect((await reverse(request("/api/stock/documents/12/reverse", body), context())).status).toBe(400);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.reverse).not.toHaveBeenCalled();
  });

  it("rejects invalid reversal IDs before calling the service", async () => {
    const response = await reverse(request("/api/stock/documents/abc/reverse", "{}"), context("abc"));
    expect(response.status).toBe(400);
    expect(mocks.reverse).not.toHaveBeenCalled();
  });

  it("requires a session before either write service", async () => {
    mocks.actor.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Sign in"));
    expect((await post(request("/api/stock/documents", "{}"), undefined)).status).toBe(401);
    expect((await reverse(request("/api/stock/documents/12/reverse", "{}"), context())).status).toBe(401);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.reverse).not.toHaveBeenCalled();
  });

  it.each([403, 409])("preserves service authorization/conflict status %s", async (status) => {
    const error = new ApiError(status, "SERVICE_ERROR", "Denied");
    mocks.post.mockRejectedValue(error);
    mocks.reverse.mockRejectedValue(error);
    const responses = [
      await post(request("/api/stock/documents", "{}"), undefined),
      await reverse(request("/api/stock/documents/12/reverse", "{}"), context()),
    ];
    for (const response of responses) {
      expect(response.status).toBe(status);
      expect((await response.json()).error.code).toBe("SERVICE_ERROR");
    }
  });
});

describe("document view HTTP contract", () => {
  it.each(["", "?view=full", "?view=lines"])("maps PO view %s to the service", async (suffix) => {
    const response = await getPo(new Request(`http://localhost/api/purchase-orders/12${suffix}`), { params: Promise.resolve({ poId: "12" }) });
    expect(response.status).toBe(200);
    expect(mocks.po).toHaveBeenCalledWith(actor, 12, suffix === "?view=lines" ? "lines" : "full");
  });

  it.each(["", "?view=full", "?view=confirmation"])("maps carrier view %s to the service", async (suffix) => {
    const response = await getCarrier(new Request(`http://localhost/api/carrier-receipts/12${suffix}`), { params: Promise.resolve({ receiptId: "12" }) });
    expect(response.status).toBe(200);
    expect(mocks.carrier).toHaveBeenCalledWith(actor, 12, suffix === "?view=confirmation" ? "confirmation" : "full");
  });

  it.each(["", "unknown"])("rejects invalid view=%s before reading either detail", async (view) => {
    const poResponse = await getPo(new Request(`http://localhost/api/purchase-orders/12?view=${view}`), { params: Promise.resolve({ poId: "12" }) });
    const carrierResponse = await getCarrier(new Request(`http://localhost/api/carrier-receipts/12?view=${view}`), { params: Promise.resolve({ receiptId: "12" }) });
    expect(poResponse.status).toBe(400);
    expect(carrierResponse.status).toBe(400);
    expect(mocks.po).not.toHaveBeenCalled();
    expect(mocks.carrier).not.toHaveBeenCalled();
  });
});
