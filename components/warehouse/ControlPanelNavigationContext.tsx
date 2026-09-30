"use client";

import { createContext, useContext } from "react";
import type { AuditCategory } from "./auditLog";

export type ControlPanelTab =
  | "members"
  | "org"
  | "branches"
  | "audit"
  | "security"
  | "scopes"
  | "account-status"
  | "master-data";

type ControlPanelNavigationValue = {
  tab: ControlPanelTab;
  setTab: (tab: ControlPanelTab) => void;
  auditCategory: string;
  setAuditCategory: (category: string) => void;
  auditCategories: AuditCategory[];
  setAuditCategories: (categories: AuditCategory[]) => void;
};

const ControlPanelNavigationContext =
  createContext<ControlPanelNavigationValue | null>(null);

export const ControlPanelNavigationProvider =
  ControlPanelNavigationContext.Provider;

export function useControlPanelNavigation() {
  const value = useContext(ControlPanelNavigationContext);
  if (!value) {
    throw new Error(
      "useControlPanelNavigation must be used within ControlPanelNavigationProvider",
    );
  }
  return value;
}
