import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalBigIntId,
  rejectUnknownFields,
  requiredBoolean,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  BarcodeType,
  ProductBarcodeInput,
} from "@/lib/product-barcodes/types";
export function parseProductBarcode(
  b: Record<string, unknown>,
): ProductBarcodeInput {
  rejectUnknownFields(b, [
    "productUnitId",
    "barcode",
    "barcodeType",
    "isPrimary",
  ]);
  const barcode = requiredText(b, "barcode");
  if (barcode.length > 128)
    throw new ValidationError({ barcode: "Use at most 128 characters." });
  const type = requiredText(b, "barcodeType").toUpperCase() as BarcodeType;
  if (!["EAN_13", "UPC_A", "CODE_128", "QR", "INTERNAL"].includes(type))
    throw new ValidationError({ barcodeType: "Unsupported barcode type." });
  return {
    productUnitId: optionalBigIntId(b, "productUnitId"),
    barcode,
    barcodeType: type,
    isPrimary: requiredBoolean(b, "isPrimary"),
  };
}
