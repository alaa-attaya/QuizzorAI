import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { useSession } from "@clerk/clerk-expo";

// Environment variables
const env = (Constants.expoConfig?.extra as any) || process.env;
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.EXPO_PUBLIC_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase URL or key in env");
}

/**
 * Factory function to create a Supabase client using Clerk session token
 */
export function createClerkSupabaseClient(
  sessionToken: string | null
): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    async accessToken() {
      return sessionToken;
    },
  });
}
