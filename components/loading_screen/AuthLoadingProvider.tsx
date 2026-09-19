"use client";

import React, { createContext, useContext } from "react";

interface AuthLoadingContextType {
  isAuthLoading: boolean;
}

const AuthLoadingContext = createContext<AuthLoadingContextType>({
  isAuthLoading: false,
});

export function AuthLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLoadingContext.Provider value={{ isAuthLoading: false }}>
      {children}
    </AuthLoadingContext.Provider>
  );
}

export function useAuthLoading() {
  return useContext(AuthLoadingContext);
}

export default AuthLoadingProvider;
