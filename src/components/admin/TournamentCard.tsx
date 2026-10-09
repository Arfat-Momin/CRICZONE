import Link from "next/link";
import { format } from "date-fns";
import type { AdminTournamentSummary } from "@/lib/queries/admin";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  registration: "Registration",
  ready: "Ready",
  live: "Live",
  ended: "Ended",
  archived: "Archived",
};

const STATUS_CLS: Record<string, string> = {
  draft: "bg-[#1B4332]/10 text-[#1B4332]",
  registration: "bg-mint text-forest",
  ready: "bg-[#FFA000] text-white",
  live: "bg-sold text-white",
  ended: "bg-[#1B4332]/10 text-[#1B4332]",
  archived: "bg-[#1B4332]/10 text-[#1B4332]",
};

export function TournamentCard({ t }: { t: AdminTournamentSummary }) {
  return (
    <Link
      href={`/admin/${t.id}`}
      className="block rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D6A4F]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_CLS[t.status] ?? STATUS_CLS.draft}`}
        >
          {STATUS_LABEL[t.status] ?? t.status}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332]/50">
          /t/{t.slug}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 font-[family-name:var(--font-display)] text-lg font-bold text-forest">
        {t.name}
      </h3>

      <div className="mt-2 space-y-0.5 text-xs text-[#1B4332]/65">
        {t.venue && <p className="line-clamp-1">📍 {t.venue}</p>}
        {t.auction_start_at && (
          <p>
            📅 {format(new Date(t.auction_start_at), "MMM d, yyyy · h:mm a")}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-[#1B4332]/10 pt-3 text-xs font-semibold text-[#1B4332]/70">
        <span>👥 {t.player_count} players</span>
        <span>·</span>
        <span>🏏 {t.team_count} teams</span>
      </div>
    </Link>
  );
}