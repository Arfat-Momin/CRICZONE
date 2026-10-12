"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSiteStateAction, type SiteState } from "@/lib/actions/site";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

export function SiteMaintenanceToggle({ current }: { current: SiteState }) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [value, setValue] = useState<SiteState>(current);
  const [pending, start] = useTransition();

  function onChange(next: SiteState) {
    if (next === value) return;

    start(async () => {
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

      setValue(next);
      const r = await setSiteStateAction(next);
      if (!r.ok) {
        await dialogs.alert({
          title: "Could not update site status",
          description: r.error,
          tone: "danger",
        });
        setValue(current);
        return;
      }
      router.refresh();
    });
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
          onClick={() => onChange("online")}
          disabled={pending || !isMaintenance}
          className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Go Online
        </button>
        <button
          type="button"
          onClick={() => onChange("maintenance")}
          disabled={pending || isMaintenance}
          className="flex-1 rounded-lg bg-sold px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Go Offline
        </button>
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#1B4332]/45">
        Localhost is always online · production only
      </p>
    </div>
  );
}