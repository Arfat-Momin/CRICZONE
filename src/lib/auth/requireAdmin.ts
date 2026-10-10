import "server-only";

import { cache } from "react";
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
 * Server-side guard for admin mutations and admin-only routes.
 *
 * Wrapped in React.cache() so layout + page + nested components calling
 * requireAdmin() only trigger ONE auth check per request.
 */
export const requireAdmin = cache(async () => {
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
});