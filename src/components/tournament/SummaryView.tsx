import type { Tables } from "@/types/supabase";
import { SummaryPlayerRankings } from "./SummaryPlayerRankings";
import { SummarySquadCard } from "./SummarySquadCard";

export function SummaryView({
  tournament,
  players,
  teams,
}: {
  tournament: Tables<"tournaments">;
  players: Tables<"players">[];
  teams: Tables<"teams">[];
}) {
  const totalSold = players.filter((p) => p.status === "sold").length;
  const totalUnsold = players.filter((p) => p.status === "unsold").length;
  const totalSpent = players
    .filter((p) => p.status === "sold")
    .reduce((sum, p) => sum + (p.selling_price ?? 0), 0);

  const sortedTeams = [...teams].sort((a, b) => {
    const aCount = players.filter((p) => p.sold_to_team_id === a.id).length;
    const bCount = players.filter((p) => p.sold_to_team_id === b.id).length;
    if (aCount !== bCount) return bCount - aCount;
    return a.points_remaining - b.points_remaining;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="text-center">
        <span className="inline-block rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-mint">
          {tournament.status === "archived" ? "Archived Auction" : "Auction Ended"}
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-cream text-glow-mint md:text-5xl">
          {tournament.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/60">
          Thank you for participating. Here are the final results.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3 md:gap-4">
        <Stat label="Sold" value={totalSold} tone="success" />
        <Stat label="Unsold" value={totalUnsold} tone="amber" />
        <Stat label="Total Spent" value={`${totalSpent} pts`} tone="forest" />
      </div>

      <section className="mt-14">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-cream md:text-3xl">
          Player Sale Rankings
        </h2>
        <SummaryPlayerRankings players={players} teams={teams} />
      </section>

      <section className="mt-14">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-cream md:text-3xl">
          Final Squads
        </h2>
        {sortedTeams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mint/20 bg-[#0A1410]/60 p-10 text-center text-sm text-cream/55">
            No teams were configured for this tournament.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedTeams.map((t) => (
              <SummarySquadCard key={t.id} team={t} players={players} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "success" | "amber" | "forest";
}) {
  const color =
    tone === "success"
      ? "text-mint"
      : tone === "amber"
        ? "text-[#FFA000]"
        : "text-cream";
  return (
    <div className="rounded-xl border border-mint/12 bg-[#0A1410] p-3 text-center md:p-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-cream/45 md:text-[10px]">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-numeric)] text-xl font-bold md:text-2xl ${color}`}
      >
        {value}
      </p>
    </div>
  );
}