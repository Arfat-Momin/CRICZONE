"use client";

import { useMemo, useState } from "react";
import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

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
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="mx-1 inline-flex min-w-full flex-wrap gap-1 rounded-xl border border-mint/15 bg-[#0A1410] p-1 sm:min-w-0">
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
      </div>

      <div className="mt-4 sm:mt-6">
        {tab === "pending" &&
          (pending.length === 0 ? (
            <Empty text="No players left to auction." />
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {pending.map((p) => (
                <MiniCard key={p.id} player={p} />
              ))}
            </div>
          ))}

        {tab === "sold" &&
          (sold.length === 0 ? (
            <Empty text="No players sold yet." />
          ) : (
            <ul className="space-y-1.5 sm:space-y-2">
              {sold.map((p) => {
                const team = p.sold_to_team_id
                  ? teamsById[p.sold_to_team_id]
                  : null;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-mint/12 bg-[#0A1410] p-2 transition hover:border-mint/35 sm:gap-3 sm:rounded-xl sm:p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-mint/25 sm:h-10 sm:w-10">
                        <ZoomableImage
                          src={
                            p.photo_url ||
                            "https://placehold.co/200x200/0A1410/D8F3DC?text=%3F"
                          }
                          alt={p.full_name}
                          loading="lazy"
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-cream sm:text-sm">
                          {p.full_name}
                        </p>
                        <p className="truncate text-[10px] text-cream/55 sm:text-xs">
                          {team?.team_name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-sold/40 bg-sold/10 px-2 py-0.5 font-[family-name:var(--font-numeric)] text-[11px] font-bold text-sold sm:px-3 sm:py-1 sm:text-sm">
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
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
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
      className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition sm:flex-initial sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.22em] ${
        active
          ? "bg-[#050A08] text-cream"
          : "text-cream/55 hover:text-cream/85"
      }`}
      style={active ? { boxShadow: `0 0 20px -8px ${activeColor}` } : undefined}
    >
      {label}
      <span
        className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold sm:text-[10px]"
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
      className={`flex flex-col items-center rounded-lg border p-1.5 text-center transition hover:-translate-y-0.5 sm:rounded-xl sm:p-2 ${
        variant === "unsold"
          ? "border-[#FFA000]/15 bg-[#0A1410]/60 opacity-70"
          : "border-mint/12 bg-[#0A1410] hover:border-mint/35"
      }`}
    >
      <div className="h-10 w-10 overflow-hidden rounded-full border border-mint/25 sm:h-12 sm:w-12">
        {/* Click opens the high-res lightbox */}
        <ZoomableImage
          src={photo}
          alt={player.full_name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight text-cream sm:mt-2 sm:text-xs">
        {player.full_name}
      </p>
      {variant === "unsold" && (
        <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#FFA000]/70 sm:text-[9px]">
          Unsold
        </span>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-mint/15 bg-[#0A1410]/50 p-4 text-center text-xs text-cream/55 sm:p-6 sm:text-sm">
      {text}
    </p>
  );
}