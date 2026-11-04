"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api/client";
import type { ManagedModuleKey, ModuleStatus } from "@/lib/contracts/module-status";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";

export default function ModuleAvailabilityGuard({
  moduleKey,
  children,
}: {
  moduleKey: ManagedModuleKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void apiGet<ModuleStatus[]>("/api/modules/status", { signal: controller.signal })
      .then(({ data }) => {
        const status = data.find((item) => item.moduleKey === moduleKey);
        if (status?.isEnabled === false) {
          const reason = status.maintenanceReason || "โมดูลนี้กำลังปิดปรับปรุง";
          router.replace(`/maintenance?module=${moduleKey}&reason=${encodeURIComponent(reason)}`);
          return;
        }
        setAvailable(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(true);
      });

    return () => controller.abort();
  }, [moduleKey, router]);

  if (available !== true) {
    return (
      <div className="w-full space-y-4 p-6" aria-busy="true">
        <SkeletonBox className="h-9 w-56 rounded-lg" />
        <SkeletonBox className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return children;
}
