// src/providers/SupabaseProvider.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useClerkSupabaseClient } from "@/lib/supabase";
import { useSession } from "@clerk/clerk-expo";

type SupabaseContextValue = {
  supabase: ReturnType<typeof useClerkSupabaseClient> | null;
  userId: string | null;
  sessionId: string | null;
  isSignedIn: boolean;
  session: ReturnType<typeof useSession>["session"] | null;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const { session, isSignedIn, isLoaded } = useSession();
  const supabase = useClerkSupabaseClient();

  const value: SupabaseContextValue = {
    supabase: supabase,
    userId: session?.user.id ?? null,
    sessionId: session?.id ?? null,
    isSignedIn: !!isSignedIn,
    session: isLoaded && isSignedIn ? session : null,
  };

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
