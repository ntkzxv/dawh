"use client";

import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { useTheme } from "@/context/ThemeContext";

export type ReceivingStep = "po" | "supplier" | "carrier" | "count";

const stepWidths: Record<ReceivingStep, string> = {
  po: "w-24",
  supplier: "w-24",
  carrier: "w-32",
  count: "w-28",
};

const tableLayouts: Record<
  ReceivingStep,
  { columns: number; minWidth: string }
> = {
  po: { columns: 3, minWidth: "560px" },
  supplier: { columns: 6, minWidth: "980px" },
  carrier: { columns: 4, minWidth: "760px" },
  count: { columns: 5, minWidth: "820px" },
};

export function ReceivingTabsSkeleton({ employeeOnly = false }: { employeeOnly?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const tabSteps: ReceivingStep[] = employeeOnly
    ? ["carrier"]
    : ["po", "supplier", "carrier", "count"];

  return (
    <div
      aria-hidden="true"
      className={`flex h-[42px] w-full flex-row items-stretch overflow-x-auto rounded-lg border px-1 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#737D88] bg-white" : "border-[#444444] bg-[#383838]"}`}
    >
      {tabSteps.map((step) => (
        <div
          key={step}
          className="relative flex h-full min-w-max flex-1 basis-0 items-center justify-center px-4"
        >
          <SkeletonBox className={`h-3.5 ${stepWidths[step]} rounded`} />
          {step === (employeeOnly ? "carrier" : "po") && (
            <div className={`absolute bottom-0 left-5 right-5 h-[2px] ${isLight ? "bg-black" : "bg-[var(--text-secondary)]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ReceivingContentSkeleton({ step = "po" }: { step?: ReceivingStep }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const layout = tableLayouts[step];
  const columns: DataTableColumn<Record<string, never>>[] = Array.from(
    { length: layout.columns },
    (_, index) => ({ key: `receiving-${step}-${index}`, header: "" }),
  );

  return (
    <section className="p-0" aria-hidden="true">
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={() => "receiving-skeleton"}
        isLoading
        skeletonRowCount={6}
        minWidth={layout.minWidth}
        className={dataTableFrameClassName(isLight)}
      />
      <div className="mt-3 flex flex-col items-center justify-between gap-4 py-3 sm:flex-row" aria-hidden="true">
        <SkeletonBox className="h-3.5 w-36 self-start rounded sm:self-auto" />
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <SkeletonBox className="size-8 rounded-lg" />
          {[0, 1, 2].map((item) => (
            <SkeletonBox key={item} className="size-8 rounded-lg" />
          ))}
          <SkeletonBox className="size-8 rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export function ReceivingPageSkeleton({
  step = "po",
  employeeOnly = false,
}: {
  step?: ReceivingStep;
  employeeOnly?: boolean;
}) {
  return (
    <div className="space-y-5">
      <ReceivingTabsSkeleton employeeOnly={employeeOnly} />
      <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
        <SkeletonBox className="h-[38px] w-full min-w-0 rounded-md sm:flex-1" />
        <SkeletonBox className="size-[38px] shrink-0 rounded-md" />
        <SkeletonBox className="h-[38px] w-[180px] shrink-0 rounded-md" />
      </div>
      <ReceivingContentSkeleton step={employeeOnly ? "carrier" : step} />
    </div>
  );
}
