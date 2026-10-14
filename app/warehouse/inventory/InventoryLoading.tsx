import { SkeletonBox, SkeletonDataTable } from "@/components/loading_screen/SkeletonLoading";

export function ProductInventorySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูลสินค้า"
      className="min-h-full bg-[#F8FAFC] p-6 text-[#222222] dark:bg-[#2C2C2C] dark:text-[#F8FAFC] lg:p-8"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SkeletonBox className="h-9 w-full rounded-md sm:w-72" />
            <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:ml-auto">
            <SkeletonBox className="h-9 w-24 rounded-xl" />
            <SkeletonBox className="h-9 w-24 rounded-xl" />
            <SkeletonBox className="h-9 w-32 rounded-xl" />
          </div>
        </div>
        <SkeletonDataTable
          rows={6}
          columns={9}
          showToolbar={false}
          minWidth="1080px"
          ariaLabel="กำลังโหลดข้อมูลสินค้า"
        />
        <div className="flex items-center justify-between gap-4">
          <SkeletonBox className="h-4 w-36 rounded-md" />
          <div className="flex gap-2">
            <SkeletonBox className="h-9 w-20 rounded-lg" />
            <SkeletonBox className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function CatalogLoadingSkeleton({ showTitle = true }: { showTitle?: boolean } = {}) {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูลหลัก"
      className="w-full space-y-6 p-6 lg:p-8"
    >
      {showTitle && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonBox className="h-7 w-56 rounded-lg" />
            <SkeletonBox className="h-4 w-72 max-w-[75vw] rounded-md" />
          </div>
          <SkeletonBox className="h-9 w-32 rounded-xl" />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <SkeletonBox className="h-9 w-64 max-w-[70vw] rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl" />
        </div>
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>
      <SkeletonDataTable rows={7} columns={5} showToolbar={false} />
    </div>
  );
}
