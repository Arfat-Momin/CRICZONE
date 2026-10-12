"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTournamentStatusAction } from "@/lib/actions/tournament";
import { useAppDialogs } from "@/components/shared/ConfirmProvider";
import type { Tables } from "@/types/supabase";

type Status = Tables<"tournaments">["status"];

const OPTIONS: readonly Status[] = [
  "draft",
  "registration",
  "ready",
  "live",
  "ended",
  "archived",
];

export function TournamentStatusSelect({
  tournamentId,
  current,
}: {
  tournamentId: string;
  current: Status;
}) {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [value, setValue] = useState<Status>(current);
  const [pending, start] = useTransition();

  function onChange(next: Status) {
    setValue(next);
    start(async () => {
      const result = await updateTournamentStatusAction(tournamentId, next);
      if (!result.ok) {
        await dialogs.alert({
          title: "Could not update status",
          description: result.error,
          tone: "danger",
        });
        setValue(current);
        return;
      }
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      disabled={pending}
      className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-forest outline-none focus:border-[#2D6A4F] disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}