import { BillPrint } from "@/components/sales/PrintDocs";

export default async function Page({ params }: { params: Promise<{ saleId: string }> }) {
  return <BillPrint saleId={Number((await params).saleId)} />;
}
