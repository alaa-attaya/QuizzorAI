import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase URL or key in environment variables");
}

export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      fetch: async (url, options: RequestInit = {}) => {
        try {
          const token = await getToken();
          const headers = new Headers(options.headers); // ✅ now type-safe
          if (token) headers.set("Authorization", `Bearer ${token}`);

          console.log(
            "Supabase fetch headers:",
            Object.fromEntries(headers.entries())
          );

          return fetch(url, {
            ...options,
            headers,
          });
        } catch (err) {
          console.error("Supabase fetch error:", err);
          return fetch(url, options);
        }
      },
    },
  });
}
