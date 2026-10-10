import { format } from "date-fns";
import { CountdownTimer } from "./CountdownTimer";
import type { Tables } from "@/types/supabase";

const STATUS_LABEL: Record<string, string> = {
  registration: "Registration Open",
  ready: "Starting Soon",
  live: "LIVE NOW",
  ended: "Completed",
  archived: "Archived",
};

export function TournamentHero({ tournament }: { tournament: Tables<"tournaments"> }) {
  const startIso = tournament.auction_start_at;
  const isLive = tournament.status === "live";
  const isFinished = tournament.status === "ended" || tournament.status === "archived";

  return (
    <section className="relative isolate border-b border-[#1B4332]/10 bg-gradient-to-b from-[#D8F3DC]/45 via-[#FDFCF0] to-transparent">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {tournament.poster_url && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-[#1B4332]/10 shadow-lg">
            <div className="aspect-[21/9] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tournament.poster_url}
                alt={`${tournament.name} poster`}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
            isLive ? "bg-sold text-white" : "bg-forest text-cream"
          }`}
        >
          {isLive && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          )}
          {STATUS_LABEL[tournament.status] ?? "Tournament"}
        </span>

        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-forest md:text-5xl">
          {tournament.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#1B4332]/70">
          {tournament.venue && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📍</span> {tournament.venue}
            </span>
          )}
          {startIso && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📅</span>{" "}
              {format(new Date(startIso), "EEE, MMM d · h:mm a")}
            </span>
          )}
        </div>

        {startIso && !isLive && !isFinished && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]">
              Auction begins in
            </p>
            <CountdownTimer targetIso={startIso} />
          </div>
        )}
      </div>
    </section>
  );
}