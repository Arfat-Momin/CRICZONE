import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAdminEmail } from "@/lib/env";

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED";
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";
  constructor(message = "Not authorized") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Server-side guard for every admin mutation and admin-only route.
 * Usage: const { supabase, user } = await requireAdmin();
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  const email = user.email;
  if (!email || email !== getAdminEmail()) {
    throw new ForbiddenError();
  }

  return { supabase, user: { id: user.id, email } };
}