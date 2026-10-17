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
  { columns: number; minWidth: string; titleWidth: string; buttonWidth: string }
> = {
  po: { columns: 3, minWidth: "560px", titleWidth: "w-36", buttonWidth: "w-24" },
  supplier: { columns: 6, minWidth: "980px", titleWidth: "w-32", buttonWidth: "w-40" },
  carrier: { columns: 4, minWidth: "760px", titleWidth: "w-48", buttonWidth: "w-32" },
  count: { columns: 5, minWidth: "820px", titleWidth: "w-24", buttonWidth: "w-32" },
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
      className={`flex h-[42px] w-full flex-row items-start gap-2 overflow-x-auto border-b select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#E4E4E7]/70" : "border-[#444444]"}`}
    >
      {tabSteps.map((step) => (
        <div
          key={step}
          className="flex h-[42px] min-w-max flex-1 basis-0 items-center justify-center px-4"
        >
          <SkeletonBox className={`h-3.5 ${stepWidths[step]} rounded`} />
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
    <section className="p-5" aria-hidden="true">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SkeletonBox className={`h-5 ${layout.titleWidth} rounded`} />
        <SkeletonBox className={`h-9 ${layout.buttonWidth} rounded-xl`} />
      </div>
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
    <div className="space-y-8">
      <ReceivingTabsSkeleton employeeOnly={employeeOnly} />
      <ReceivingContentSkeleton step={employeeOnly ? "carrier" : step} />
    </div>
  );
}
