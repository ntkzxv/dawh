"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DawhLandingPage from "../landing-page/page";
import AuthLoadingScreen from "@/components/loading_screen/AuthLoadingScreen";
import { getCurrentSession } from "@/lib/auth-client";
import { fetchAndStoreUserProfile } from "@/lib/user-profile";

interface RootSessionGateProps {
  initialHasSession?: boolean;
}

export default function RootSessionGate({
  initialHasSession = false,
}: RootSessionGateProps) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean>(initialHasSession);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(initialHasSession);

  useEffect(() => {
    // กรณี server ยืนยันว่ามี session แล้ว ให้ prefetch และนำทางเข้าสู่ workspace
    if (initialHasSession) {
      router.prefetch("/workspace");
      const timer = setTimeout(() => {
        router.replace("/workspace");
      }, 1600);
      return () => clearTimeout(timer);
    }

    // กรณีสำรอง: ตรวจสอบ session ฝั่ง client
    let isMounted = true;
    async function verifySession() {
      try {
        const session = await getCurrentSession();
        if (isMounted && session?.user) {
          setHasSession(true);
          setIsRedirecting(true);
          try {
            fetchAndStoreUserProfile(session.user.id, session.user.email);
          } catch {}
          router.prefetch("/workspace");
          setTimeout(() => {
            router.replace("/workspace");
          }, 1600);
        }
      } catch {
        // หากไม่มี session ให้แสดงหน้า Landing Page ต่อไปโดยไม่มี loading screen
      }
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [initialHasSession, router]);

  // หากมี session ให้แสดง Loading Screen แล้วเข้าหน้าปกติ
  if (hasSession && isRedirecting) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#181818]">
        <AuthLoadingScreen
          duration={1.6}
          onFilled={() => {
            router.replace("/workspace");
          }}
        />
      </div>
    );
  }

  // หากไม่มี session ให้เข้าหน้านี้ (Landing Page) ทันทีโดยไม่มี loading screen มากั้น
  return <DawhLandingPage />;
}
