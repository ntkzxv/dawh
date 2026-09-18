"use client";

import React from "react";

export default function RootSessionGate() {
  // Session verification and initial route redirection are cleanly managed by
  // the dedicated AuthLoadingProvider at the root layout level with AuthLoadingScreen.
  return (
    <div
      className="min-h-screen w-full bg-[#222222]"
      aria-hidden="true"
    />
  );
}
