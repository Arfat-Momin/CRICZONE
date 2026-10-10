import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Cookie-LESS Supabase client for PUBLIC data.
 *
 * Use this for landing page, archive, tournaments, roster reads —
 * anything that doesn't require the admin session.
 *
 * Why: reading `cookies()` forces dynamic rendering in Next.js.
 * By skipping cookies, these pages can be statically rendered + ISR-cached.
 * RLS still applies (anon role).
 */
export const createPublicClient = cache(() =>
  createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  }),
);