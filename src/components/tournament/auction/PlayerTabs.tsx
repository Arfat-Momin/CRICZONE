"use client";

import { useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";

type Tab = "pending" | "sold" | "unsold";

export function PlayerTabs({
  players,
  teams,
  onBlockPlayerId,
}: {
  players: Tables<"players">[];
  teams: Tables<"teams">[];
  onBlockPlayerId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("pending");

  const teamsById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  );

  const pending = players.filter(
    (p) => p.status === "pending" && p.id !== onBlockPlayerId,
  );
  const sold = players
    .filter((p) => p.status === "sold")
    .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0));
  const unsold = players.filter((p) => p.status === "unsold");

  return (
    <div>
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-mint/15 bg-[#0A1410] p-1">
        <TabBtn
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label="Upcoming"
          count={pending.length}
          tone="mint"
        />
        <TabBtn
          active={tab === "sold"}
          onClick={() => setTab("sold")}
          label="Sold"
          count={sold.length}
          tone="success"
        />
        <TabBtn
          active={tab === "unsold"}
          onClick={() => setTab("unsold")}
          label="Unsold"
          count={unsold.length}
          tone="amber"
        />
      </div>

      <div className="mt-6">
        {tab === "pending" &&
          (pending.length === 0 ? (
            <Empty text="No players left to auction." />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {pending.map((p) => (
                <MiniCard key={p.id} player={p} />
              ))}
            </div>
          ))}

        {tab === "sold" &&
          (sold.length === 0 ? (
            <Empty text="No players sold yet." />
          ) : (
            <ul className="space-y-2">
              {sold.map((p) => {
                const team = p.sold_to_team_id ? teamsById[p.sold_to_team_id] : null;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-mint/12 bg-[#0A1410] p-3 transition hover:border-mint/35"
                  >
                    <div className="flex items-center gap-3">
                      {p.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photo_url}
                          alt=""
                          className="h-10 w-10 rounded-full border border-mint/25 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-mint/10" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-cream">
                          {p.full_name}
                        </p>
                        <p className="truncate text-xs text-cream/55">
                          {team?.team_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap rounded-full border border-sold/40 bg-sold/10 px-3 py-1 font-[family-name:var(--font-numeric)] text-sm font-bold text-sold">
                      {p.selling_price ?? 0} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === "unsold" &&
          (unsold.length === 0 ? (
            <Empty text="No unsold players." />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {unsold.map((p) => (
                <MiniCard key={p.id} player={p} variant="unsold" />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone: "mint" | "success" | "amber";
}) {
  const activeColor =
    tone === "success"
      ? "#2D6A4F"
      : tone === "amber"
        ? "#FFA000"
        : "#D8F3DC";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] transition ${
        active
          ? "bg-[#050A08] text-cream"
          : "text-cream/55 hover:text-cream/85"
      }`}
      style={active ? { boxShadow: `0 0 24px -8px ${activeColor}` } : undefined}
    >
      {label}
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
        style={{
          background: active ? `${activeColor}22` : "rgba(253,252,240,0.08)",
          color: active ? activeColor : "rgba(253,252,240,0.55)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function MiniCard({
  player,
  variant,
}: {
  player: Tables<"players">;
  variant?: "unsold";
}) {
  const photo =
    player.photo_url || "https://placehold.co/200x200/0A1410/D8F3DC?text=%3F";
  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-3 text-center transition hover:-translate-y-0.5 ${
        variant === "unsold"
          ? "border-[#FFA000]/15 bg-[#0A1410]/60 opacity-70"
          : "border-mint/12 bg-[#0A1410] hover:border-mint/35"
      }`}
    >
      <div className="h-14 w-14 overflow-hidden rounded-full border border-mint/25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-bold text-cream">
        {player.full_name}
      </p>
      {variant === "unsold" && (
        <span className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-[#FFA000]/70">
          Unsold
        </span>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-mint/15 bg-[#0A1410]/50 p-6 text-center text-sm text-cream/55">
      {text}
    </p>
  );
}