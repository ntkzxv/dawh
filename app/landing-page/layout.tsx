import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wollo — Maximize Your Social Media Presence",
  description:
    "AI-powered social media growth engine. Automate publishing, predict viral resonance, and scale your engagement across Instagram, TikTok, YouTube, and X.",
};

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#222222] antialiased selection:bg-[var(--status-info)] selection:text-white">
      {children}
    </div>
  );
}
