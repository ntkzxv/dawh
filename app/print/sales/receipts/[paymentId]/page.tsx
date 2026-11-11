import { ReceiptPrint } from "@/components/sales/PrintDocs";

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  return <ReceiptPrint paymentId={Number((await params).paymentId)} />;
}
