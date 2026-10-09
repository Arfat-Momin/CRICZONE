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
  ready: "bg-[#FFA000] text-white",
  ended: "bg-[#1B4332]/10 text-[#1B4332]",
  archived: "bg-[#1B4332]/10 text-[#1B4332]",
  draft: "bg-[#1B4332]/10 text-[#1B4332]",
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
      className="group flex h-full flex-col rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2D6A4F]/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
            STATUS_STYLE[tournament.status] ?? STATUS_STYLE.draft,
          )}
        >
          {isLive && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          )}
          {STATUS_LABEL[tournament.status] ?? "Tournament"}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 font-[family-name:var(--font-display)] text-xl font-bold text-forest">
        {tournament.name}
      </h3>

      <div className="mt-3 space-y-1 text-sm text-[#1B4332]/65">
        {tournament.venue && (
          <p className="line-clamp-1">
            <span className="font-semibold text-[#1B4332]/80">Venue:</span>{" "}
            {tournament.venue}
          </p>
        )}
        <p>
          <span className="font-semibold text-[#1B4332]/80">Starts:</span> {startLabel}
        </p>
      </div>

      <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[#2D6A4F] transition group-hover:gap-2">
        {isLive ? "Watch Live" : "View Tournament"} <span aria-hidden>&rarr;</span>
      </span>
    </Link>
  );
}