import { format } from "date-fns";
import { CountdownTimer } from "./CountdownTimer";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
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
    <section className="relative border-b border-mint/10">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {tournament.poster_url && (
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-mint/25 shadow-[0_0_40px_-10px_rgba(216,243,220,0.35)] sm:h-28 sm:w-28">
              <ZoomableImage
                src={tournament.poster_url}
                alt={`${tournament.name} poster`}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] ${
                isLive
                  ? "bg-sold text-white"
                  : "border border-mint/25 bg-mint/10 text-mint"
              }`}
            >
              {isLive && (
                <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              )}
              {STATUS_LABEL[tournament.status] ?? "Tournament"}
            </span>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-cream text-glow-mint md:text-4xl lg:text-5xl">
              {tournament.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-cream/65">
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
          </div>
        </div>

        {startIso && !isLive && !isFinished && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.32em] text-mint/70">
              Auction begins in
            </p>
            <CountdownTimer targetIso={startIso} />
          </div>
        )}
      </div>
    </section>
  );
}