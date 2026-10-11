import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PublicTournament } from "@/lib/queries/tournaments";

const STATUS_LABEL: Record<string, string> = {
  registration: "Registration Open",
  ready: "Starting Soon",
  live: "LIVE NOW",
  ended: "Completed",
  archived: "Archived",
  draft: "Draft",
};

const STATUS_STYLE: Record<string, string> = {
  live: "bg-sold text-white",
  registration: "bg-mint text-forest",
  ready: "bg-[#FFA000] text-[#0A1410]",
  ended: "bg-cream/10 text-cream/70",
  archived: "bg-cream/10 text-cream/70",
  draft: "bg-cream/10 text-cream/70",
};

type Props = {
  tournament: PublicTournament;
};

export function TournamentCard({ tournament }: Props) {
  const isLive = tournament.status === "live";
  const startLabel = tournament.auction_start_at
    ? format(new Date(tournament.auction_start_at), "EEE, MMM d · h:mm a")
    : "Schedule TBA";

  return (
    <Link
      href={`/t/${tournament.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mint/12 glass-dark p-6 transition hover:-translate-y-1 hover:border-mint/35 hover:shadow-[0_20px_60px_-20px_rgba(216,243,220,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A08]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[radial-gradient(ellipse_at_center,rgba(216,243,220,0.15),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
            STATUS_STYLE[tournament.status] ?? STATUS_STYLE.draft,
          )}
        >
          {isLive && (
            <span className="cz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
          )}
          {STATUS_LABEL[tournament.status] ?? "Tournament"}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 font-[family-name:var(--font-display)] text-xl font-bold text-cream">
        {tournament.name}
      </h3>

      <div className="mt-3 space-y-1 text-sm text-cream/60">
        {tournament.venue && (
          <p className="line-clamp-1">
            <span className="font-semibold text-cream/80">Venue:</span>{" "}
            {tournament.venue}
          </p>
        )}
        <p>
          <span className="font-semibold text-cream/80">Starts:</span>{" "}
          {startLabel}
        </p>
      </div>

      <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-mint transition group-hover:gap-2">
        {isLive ? "Watch Live" : "View Tournament"}{" "}
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}