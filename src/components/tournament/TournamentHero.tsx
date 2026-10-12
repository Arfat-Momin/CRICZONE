import Image from "next/image";
import { format } from "date-fns";
import { CountdownTimer } from "./CountdownTimer";
import { ZoomableImage } from "@/components/shared/ZoomableImage";
import type { Tables } from "@/types/supabase";

const HERO_IMAGE = "/images/hero-night-cricket.jpg";

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
    <section className="relative isolate overflow-hidden border-b border-mint/10">
      {/* Stadium background */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-[#050A08]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Readability overlays */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-[#050A08]/75" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-[55%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,232,184,0.18), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-20 bg-gradient-to-t from-[#050A08] to-transparent sm:h-24"
      />

      {/* Centered content */}
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-12 md:py-16 lg:py-20">
        {/* Poster */}
        {tournament.poster_url && (
          <div className="mb-4 h-20 w-20 overflow-hidden rounded-2xl border-2 border-mint/40 shadow-[0_0_40px_-12px_rgba(216,243,220,0.55)] sm:mb-5 sm:h-28 sm:w-28 md:h-32 md:w-32">
            <ZoomableImage
              src={tournament.poster_url}
              alt={`${tournament.name} poster`}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.24em] sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[10px] md:text-xs ${
            isLive
              ? "bg-sold text-white shadow-[0_0_24px_-4px_rgba(193,18,31,0.7)]"
              : "border border-mint/30 bg-mint/10 text-mint"
          }`}
        >
          {isLive && (
            <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {STATUS_LABEL[tournament.status] ?? "Tournament"}
        </span>

        {/* Title — no glow */}
        <h1 className="mt-3 w-full break-words font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-cream sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">
          {tournament.name}
        </h1>

        {/* Info row */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-cream/70 sm:mt-4 sm:gap-x-5 sm:text-sm md:text-base">
          {tournament.venue && (
            <span className="inline-flex max-w-full items-center gap-1.5">
              <span aria-hidden>📍</span>
              <span className="truncate">{tournament.venue}</span>
            </span>
          )}
          {startIso && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📅</span>{" "}
              {format(new Date(startIso), "EEE, MMM d · h:mm a")}
            </span>
          )}
        </div>

        {/* Countdown */}
        {startIso && !isLive && !isFinished && (
          <div className="mt-6 flex flex-col items-center sm:mt-8 md:mt-10">
            <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.28em] text-mint/80 sm:mb-3 sm:text-[10px] md:text-xs">
              Auction begins in
            </p>
            <CountdownTimer targetIso={startIso} />
          </div>
        )}
      </div>
    </section>
  );
}