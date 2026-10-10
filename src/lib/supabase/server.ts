import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Server-side Supabase client (anon key, cookie-based session).
 *
 * Wrapped in React.cache() so that multiple calls within the SAME
 * server request reuse a single client instance — big latency win when
 * a layout + page + multiple queries all need the client.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component context — middleware refreshes session.
        }
      },
    },
  });
});