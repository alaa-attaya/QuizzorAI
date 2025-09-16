// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/clerk-expo";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase URL or key in environment variables");
}

export function useClerkSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    accessToken: async () => session?.getToken() ?? null,
  });
}
