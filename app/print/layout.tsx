import type { ReactNode } from "react";

// Outside app/sales/layout.tsx on purpose: no sidebar, so the printout is clean.
// Light-only: the document must not follow the app's dark mode.
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white" style={{ colorScheme: "only light", color: "#111827" }}>
      <style>{`@page { size: A4; margin: 12mm; } html, body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }`}</style>
      {children}
    </div>
  );
}
