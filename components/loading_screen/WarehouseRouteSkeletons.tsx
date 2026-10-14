import { SkeletonBox, SkeletonDataTable } from "./SkeletonLoading";

export function StockRouteSkeleton({ ledger = false }: { ledger?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-10 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {ledger && <SkeletonBox className="h-9 w-full rounded-md sm:w-[300px]" />}
          {!ledger && <SkeletonBox className="h-[37px] w-[244px] rounded-lg" />}
          <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-40 rounded-xl" />
        </div>
      </div>
      <SkeletonDataTable rows={6} columns={ledger ? 8 : 5} showToolbar={false} />
    </main>
  );
}

export function DashboardRouteSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 p-4 pb-10 sm:p-8" aria-hidden="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <section key={item} className="flex min-h-[120px] flex-col justify-between gap-4 rounded-xl border border-slate-200/70 p-4 dark:border-white/[0.08] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBox className="h-3.5 w-28 rounded" />
              <SkeletonBox className="size-8 rounded-lg" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-8 w-20 rounded" />
              <SkeletonBox className="h-3 w-36 rounded" />
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <section key={item} className="flex min-h-[108px] flex-col justify-between gap-3 rounded-xl border border-slate-200/70 p-4 dark:border-white/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBox className="h-3.5 w-28 rounded" />
              {item < 3 && <SkeletonBox className="size-7 rounded-lg" />}
            </div>
            {item === 3 ? (
              <div className="space-y-2">
                <SkeletonBox className="h-3.5 w-32 rounded" />
                <SkeletonBox className="h-3 w-24 rounded" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-7 w-12 rounded" />
                <SkeletonBox className="h-3 w-20 rounded" />
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
        <section className="space-y-4 rounded-xl border border-slate-200/70 p-4 sm:p-5 dark:border-white/[0.08]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-40 rounded" />
              <SkeletonBox className="h-3 w-28 rounded" />
            </div>
            <SkeletonBox className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex h-52 items-end gap-3 border-b border-slate-200/60 px-2 dark:border-white/[0.06]">
            {[38, 62, 45, 76, 54, 88, 65, 48, 72, 57, 82, 43].map((height, item) => (
              <SkeletonBox key={item} className="min-w-2 flex-1 rounded-t-md rounded-b-none" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between px-2">
            {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonBox key={item} className="h-3 w-9 rounded" />)}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200/70 p-4 sm:p-5 dark:border-white/[0.08]">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-36 rounded" />
            <SkeletonBox className="h-3 w-28 rounded" />
          </div>
          <div className="grid min-h-[190px] items-center gap-5 sm:grid-cols-[minmax(130px,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex justify-center">
              <div className="flex size-36 items-center justify-center rounded-full border-[18px] border-slate-200/70 dark:border-white/[0.08]">
                <SkeletonBox className="size-9 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <SkeletonBox className="size-2.5 shrink-0 rounded-full" />
                  <SkeletonBox className="h-3.5 min-w-0 flex-1 rounded" />
                  <SkeletonBox className="h-3.5 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {[0, 1].map((section) => (
          <section key={section} className="space-y-4 rounded-xl border border-slate-200/70 p-4 sm:p-5 dark:border-white/[0.08]">
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-40 rounded" />
              <SkeletonBox className="h-3 w-28 rounded" />
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 py-3.5">
                  <SkeletonBox className="size-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBox className="h-3.5 w-2/5 rounded" />
                    <SkeletonBox className="h-3 w-3/5 rounded" />
                  </div>
                  <SkeletonBox className="h-3.5 w-16 shrink-0 rounded" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200/70 p-4 sm:p-5 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-44 rounded" />
            <SkeletonBox className="h-3 w-56 rounded" />
          </div>
          <SkeletonBox className="h-3.5 w-28 rounded" />
        </div>
        <SkeletonDataTable rows={5} columns={7} showToolbar={false} minWidth="1080px" />
      </section>
    </main>
  );
}

export function ReceivingRouteSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/70 p-1 dark:border-white/[0.08]">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex h-11 min-w-36 flex-1 items-center justify-center gap-2 rounded-lg">
            <SkeletonBox className="size-6 rounded-full" />
            <SkeletonBox className="h-3.5 w-20 rounded" />
          </div>
        ))}
      </div>
      <ReceivingContentSkeleton />
    </div>
  );
}

export function ReceivingContentSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <section className="space-y-4 rounded-xl border border-slate-200/70 p-4 sm:p-5 dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-4">
          <SkeletonBox className="h-5 w-36 rounded" />
          <SkeletonBox className="h-8 w-24 rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-2">
              <SkeletonBox className="h-3 w-20 rounded" />
              <SkeletonBox className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 px-4 py-3 dark:border-white/[0.08]">
          <SkeletonBox className="h-4 w-40 rounded" />
          <SkeletonBox className="h-8 w-24 rounded-lg" />
        </div>
        <div className="px-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 border-b border-slate-200/50 py-4 last:border-0 dark:border-white/[0.05]">
              <SkeletonBox className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBox className="h-3.5 w-1/3 rounded" />
                <SkeletonBox className="h-3 w-1/2 rounded" />
              </div>
              <SkeletonBox className="h-7 w-20 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TransferRouteSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 p-4 pb-10 sm:p-8" aria-hidden="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex min-h-[128px] flex-col justify-between gap-4 rounded-xl border border-slate-200/70 p-4 dark:border-white/[0.08] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBox className="h-3.5 w-28 rounded" />
              <SkeletonBox className="size-8 rounded-lg" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-8 w-16 rounded" />
              <SkeletonBox className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/70 p-3 dark:border-white/[0.08] sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <SkeletonBox className="h-9 w-full rounded-md sm:w-[300px]" />
          <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <SkeletonDataTable rows={6} columns={8} showToolbar={false} minWidth="1120px" />
      <div className="flex flex-wrap items-center justify-between gap-3" aria-hidden="true">
        <SkeletonBox className="h-3.5 w-40 rounded" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="size-8 rounded-lg" />
          {[0, 1, 2].map((item) => <SkeletonBox key={item} className="size-8 rounded-lg" />)}
          <SkeletonBox className="size-8 rounded-lg" />
        </div>
      </div>
    </main>
  );
}

export function TransferAuditRouteSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-10 sm:p-8" aria-hidden="true">
      <div className="space-y-2">
        <SkeletonBox className="h-3.5 w-full max-w-2xl rounded" />
        <SkeletonBox className="h-3.5 w-3/4 max-w-xl rounded" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex min-h-[132px] flex-col justify-between gap-3 rounded-xl border border-slate-200/70 p-4 dark:border-white/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBox className="h-3.5 w-28 rounded" />
              <SkeletonBox className="size-8 rounded-lg" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-8 w-16 rounded" />
              <SkeletonBox className="h-3 w-36 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        {[0, 1].map((section) => (
          <section key={section} className="space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBox className="size-9 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-44 rounded" />
                <SkeletonBox className="h-3 w-36 rounded" />
              </div>
            </div>
            {section === 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/[0.08]">
                <div className="flex h-10 items-center gap-4 border-b border-slate-200/70 px-4 dark:border-white/[0.08]">
                  {[0, 1, 2, 3, 4].map((item) => <SkeletonBox key={item} className="h-3 w-24 flex-1 rounded" />)}
                </div>
                <div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex min-h-14 items-center gap-4 px-4 py-3">
                      {[0, 1, 2, 3, 4].map((cell) => (
                        <div key={cell} className="flex min-w-0 flex-1 items-center gap-2">
                          {cell === 2 && <SkeletonBox className="size-2 shrink-0 rounded-full" />}
                          <SkeletonBox className={`h-3.5 rounded ${cell === 0 ? "w-28" : cell === 1 ? "w-36" : cell === 2 ? "w-16" : cell === 3 ? "w-24" : "w-28"}`} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="divide-y divide-slate-200/60 rounded-xl border border-slate-200/70 dark:divide-white/[0.06] dark:border-white/[0.08]">
                {[0, 1, 2, 3, 4].map((item) => (
                  <li key={item} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <SkeletonBox className="h-3.5 w-2/5 rounded" />
                        <SkeletonBox className="h-3 w-1/3 rounded" />
                      </div>
                      <SkeletonBox className="h-3 w-28 shrink-0 rounded" />
                    </div>
                    <SkeletonBox className="h-3 w-1/2 rounded" />
                    {item % 2 === 0 && <SkeletonBox className="h-3 w-24 rounded" />}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

export function IssuesRouteSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#383838]">
        <SkeletonBox className="h-6 w-40 rounded-md" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((item) => <SkeletonBox key={item} className="h-14 w-full rounded-xl" />)}
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#383838]">
        <SkeletonBox className="h-6 w-44 rounded-md" />
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-2">
            <SkeletonBox className="h-4 w-28 rounded" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <SkeletonBox className="h-10 w-full rounded-xl" />
      </section>
    </div>
  );
}

export function ReportsRouteSkeleton({ isThai = true }: { isThai?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2" aria-hidden="true">
        <SkeletonBox className="h-9 w-32 rounded-xl" />
        <SkeletonBox className="h-9 w-40 rounded-xl" />
      </div>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#383838]">
        <SkeletonBox className="h-6 w-56 rounded-md" />
        <SkeletonDataTable
          rows={6}
          columns={6}
          showToolbar={false}
          ariaLabel={isThai ? "กำลังโหลดรายงานคลังสินค้า" : "Loading warehouse reports"}
        />
      </section>
    </div>
  );
}
