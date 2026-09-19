"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminControlPanel from "@/components/controlpanel/AdminControlPanel";

export default function TestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/controlpanel");
  }, [router]);

  return <AdminControlPanel />;
}
