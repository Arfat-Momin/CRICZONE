"use client";

import type { Tables } from "@/types/supabase";
import type { GroupWithMembers } from "@/lib/queries/groups";

type Props = {
  groups: GroupWithMembers[];
  players: Tables<"players">[];
  disabled: boolean;
  onDrawFromGroup: (group: GroupWithMembers) => void;
  onDrawOutside: () => void;
};

export function GroupDrawButtons({
  groups,
  players,
  disabled,
  onDrawFromGroup,
  onDrawOutside,
}: Props) {
  const allGroupPlayerIds = new Set<string>();
  for (const g of groups) {
    for (const pid of g.player_ids) allGroupPlayerIds.add(pid);
  }

  const pendingOutside = players.filter(
    (p) => p.status === "pending" && !allGroupPlayerIds.has(p.id),
  );

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-[#7B1FA2]/25 bg-[#FDF6FF] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7B1FA2]">
        Group-wise draw
      </p>

      {groups.length === 0 ? (
        <p className="text-xs text-[#1B4332]/60">
          No groups yet. Create groups in the section above.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const remaining = players.filter(
              (p) => p.status === "pending" && g.player_ids.includes(p.id),
            ).length;
            const exhausted = remaining === 0;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onDrawFromGroup(g)}
                disabled={disabled || exhausted}
                className="flex w-full items-center justify-between gap-3 rounded-lg bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <span className="truncate">🏷️ {g.name}</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold">
                  {exhausted ? "Done" : `${remaining} left`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onDrawOutside}
        disabled={disabled || pendingOutside.length === 0}
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-gradient-to-r from-[#00695C] to-[#00897B] px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
      >
        <span className="truncate">👤 Outside groups</span>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold">
          {pendingOutside.length} left
        </span>
      </button>
    </div>
  );
}