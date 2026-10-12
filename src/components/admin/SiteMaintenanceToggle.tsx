"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setSiteStateAction, type SiteState } from "@/lib/actions/site";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";
import { createClient } from "@/lib/supabase/client";

export function SiteMaintenanceToggle({ current }: { current: SiteState }) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [value, setValue] = useState<SiteState>(current);
  const [busy, setBusy] = useState(false);
  const [debugEmail, setDebugEmail] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Show the signed-in email so we can verify the admin account in one glance
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setDebugEmail(data.user?.email ?? null))
      .catch(() => setDebugEmail(null));
  }, []);

  // Keep in sync with prop when the server re-renders
  useEffect(() => {
    setValue(current);
  }, [current]);

  async function onChange(next: SiteState) {
    if (busy || next === value) return;

    // Confirm before going offline
    if (next === "maintenance") {
      const ok = await dialogs.confirm({
        title: "Enable maintenance mode?",
        description:
          "The public site will be hidden behind a maintenance page. Only /admin remains accessible. Localhost is never affected.",
        confirmLabel: "Go Offline",
        tone: "warning",
      });
      if (!ok) return;
    }

    setBusy(true);
    setLastError(null);

    try {
      const r = await setSiteStateAction(next);

      if (!r.ok) {
        setLastError(r.error);
        await dialogs.alert({
          title: "Could not change site status",
          description: r.error,
          tone: "danger",
        });
        return;
      }

      // Optimistically flip the local state, then re-render server data
      setValue(next);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error.";
      setLastError(msg);
      await dialogs.alert({
        title: "Something went wrong",
        description: msg,
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  const isMaintenance = value === "maintenance";

  return (
    <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
            Site Status
          </h3>
          <p className="mt-0.5 text-xs text-[#1B4332]/60">
            Public visitors see the maintenance page when offline.
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
            isMaintenance ? "bg-sold text-white" : "bg-success text-white"
          }`}
        >
          {isMaintenance ? "Maintenance" : "Online"}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => void onChange("online")}
          disabled={busy || !isMaintenance}
          className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && isMaintenance ? "…" : "Go Online"}
        </button>
        <button
          type="button"
          onClick={() => void onChange("maintenance")}
          disabled={busy || isMaintenance}
          className="flex-1 rounded-lg bg-sold px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && !isMaintenance ? "…" : "Go Offline"}
        </button>
      </div>

      {lastError && (
        <p className="mt-3 rounded-md border border-sold/30 bg-sold/10 px-2.5 py-1.5 text-[10px] font-semibold text-sold">
          {lastError}
        </p>
      )}

      <div className="mt-3 border-t border-[#1B4332]/8 pt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1B4332]/45">
          Signed in as:{" "}
          <span className="font-mono text-[#1B4332]/70">
            {debugEmail ?? "loading…"}
          </span>
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#1B4332]/45">
          Localhost is always online · production only
        </p>
      </div>
    </div>
  );
}