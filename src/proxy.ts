import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getAdminEmail } from "@/lib/env";

/**
 * Proxy (formerly middleware).
 *
 * ONLY runs on /admin/* — public routes skip Supabase auth entirely,
 * which eliminates a network round-trip on every page load.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin";
  const adminEmail = getAdminEmail();

  // Not logged in → redirect to login (except on login page)
  if (!user) {
    if (isLoginPage) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but wrong email → bounce to login
  if (user.email !== adminEmail) {
    if (isLoginPage) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  // Logged-in admin on the login page → redirect to dashboard
  if (isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// CRITICAL: only run on /admin/* — public routes pay ZERO auth cost.
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};