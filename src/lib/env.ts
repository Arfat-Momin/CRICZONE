/**
 * CRICZONE — Environment variable accessors.
 * Throws a clear error at use-time if a required value is missing.
 * Server-only vars must NEVER be read by client components.
 */

export function getSupabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  return v;
}

export function getSupabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  return v;
}

export function getSupabaseServiceRoleKey(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. " +
        "This key is server-only and must be set before calling the admin client.",
    );
  }
  return v;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAdminEmail(): string {
  const v = process.env.ADMIN_EMAIL;
  if (!v) throw new Error("Missing ADMIN_EMAIL in .env.local");
  return v;
}