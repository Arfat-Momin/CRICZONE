"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRegistrationAction } from "@/lib/actions/tournament";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";

export function TournamentRegistrationToggle({
  tournamentId,
  current,
}: {
  tournamentId: string;
  current: boolean;
}) {
  const [enabled, setEnabled] = useState(current);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dialogs = useAppDialogs();

  function onChange() {
    const next = !enabled;
    setEnabled(next);
    start(async () => {
      const r = await toggleRegistrationAction(tournamentId, next);
      if (!r.ok) {
        await dialogs.alert({
          title: "Could not update registration",
          description: r.error,
          tone: "danger",
        });
        setEnabled(current);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <span
        className={`text-[10px] font-extrabold uppercase tracking-wider ${
          enabled ? "text-success" : "text-sold"
        }`}
      >
        {enabled ? "Open" : "Closed"}
      </span>
      <button
        type="button"
        onClick={onChange}
        disabled={pending}
        className={`relative h-5 w-10 shrink-0 rounded-full transition ${
          enabled ? "bg-success" : "bg-[#1B4332]/20"
        } disabled:opacity-50`}
        aria-label="Toggle registration"
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}