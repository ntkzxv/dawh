import type { Metadata } from "next";
import RootSessionGate from "./_components/RootSessionGate";

export const metadata: Metadata = {
  title: "DAWH Enterprise Platform",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default function Home() {
  return <RootSessionGate />;
}
