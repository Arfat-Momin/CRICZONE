"use client";

import { useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";
import { DeletePlayerButton } from "./DeletePlayerButton";
import { EditPlayerModal } from "./EditPlayerModal";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };

type StatusFilter = "all" | "pending" | "on_block" | "sold" | "unsold";

export function PlayerTableWithSearch({
  players,
  tournamentId,
}: {
  players: AdminPlayer[];
  tournamentId: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<AdminPlayer | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return players.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      const hay = [
        p.full_name,
        p.mobile_no ?? "",
        p.category ?? "",
        p.current_team ?? "",
        p.jersey_no != null ? String(p.jersey_no) : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [players, q, status]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, category, jersey…"
          className="w-full rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-[#1B4332]/20 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-forest outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="on_block">On block</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
        </select>
      </div>

      <p className="mb-2 text-xs font-semibold text-[#1B4332]/50">
        Showing {filtered.length} of {players.length}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-8 text-center text-sm text-[#1B4332]/60">
          {players.length === 0
            ? "No players yet. Add manually or import via CSV."
            : "No players match your filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1B4332]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#1B4332]/10 bg-[#FAFDF9] text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Jersey</th>
                <th className="hidden px-4 py-3 sm:table-cell">Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#1B4332]/5 last:border-0 hover:bg-[#FAFDF9]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photo_url}
                          alt=""
                          className="h-8 w-8 rounded-full border border-[#1B4332]/15 object-cover object-top"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#1B4332]/10" />
                      )}
                      <span className="font-semibold text-forest">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1B4332]/70">{p.category ?? "—"}</td>
                  <td className="px-4 py-3 text-[#1B4332]/70">
                    {p.jersey_no ? `#${p.jersey_no}` : "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-[#1B4332]/70 sm:table-cell">
                    {p.mobile_no ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B4332]">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="text-xs font-bold text-[#2D6A4F] hover:underline"
                      >
                        Edit
                      </button>
                      <DeletePlayerButton
                        playerId={p.id}
                        tournamentId={tournamentId}
                        playerName={p.full_name}
                        playerStatus={p.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditPlayerModal
          player={editing}
          tournamentId={tournamentId}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}