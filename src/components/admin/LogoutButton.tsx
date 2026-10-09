"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1B4332] transition hover:bg-[#D8F3DC] disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Sign Out"}
    </button>
  );
}