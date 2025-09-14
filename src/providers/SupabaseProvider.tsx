import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { createClerkSupabaseClient } from "@/lib/supabase";

type SupabaseContextValue = {
  supabase: any | null;
  userId?: string | null;
  sessionId?: string | null;
  isSignedIn: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

export const SupabaseProvider = ({
  children,
  isSignedIn,
  getToken,
  userId,
  sessionId,
}: {
  children: ReactNode;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  userId?: string | null;
  sessionId?: string | null;
}) => {
  const supabase = useMemo(() => {
    if (!isSignedIn) return null;
    return createClerkSupabaseClient(getToken);
  }, [getToken, isSignedIn]);

  const value = useMemo(
    () => ({ supabase, userId, sessionId, isSignedIn }),
    [supabase, userId, sessionId, isSignedIn]
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx)
    throw new Error("useSupabase must be used within a SupabaseProvider");
  return ctx;
};
