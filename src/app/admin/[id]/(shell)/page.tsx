import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { ReadOnlyUrlField } from "@/components/admin/ReadOnlyUrlField";
import { ExportPdfButton } from "@/components/admin/ExportPdfButton";
import { TournamentStatusSelect } from "@/components/admin/TournamentStatusSelect";
import { TournamentRegistrationToggle } from "@/components/admin/TournamentRegistrationToggle";
import { TournamentPosterCard } from "@/components/admin/TournamentPosterCard";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OverviewPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tournament) notFound();

  const [playersRes, teamsCount, groupsCount] = await Promise.all([
    supabase
      .from("players")
      .select("status, selling_price")
      .eq("tournament_id", id),
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
    supabase
      .from("player_groups")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", id),
  ]);

  const players = playersRes.data ?? [];
  const playerCount = players.length;
  const soldCount = players.filter((p) => p.status === "sold").length;
  const unsoldCount = players.filter((p) => p.status === "unsold").length;
  const pendingCount = players.filter((p) => p.status === "pending").length;
  const totalSpent = players.reduce((s, p) => s + (p.selling_price ?? 0), 0);

  const auctionUrl = `${getSiteUrl()}/t/${tournament.slug}`;
  const registerUrl = `${getSiteUrl()}/t/${tournament.slug}/register`;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/admin/${tournament.id}/live`}
          className="rounded-2xl border border-sold/30 bg-gradient-to-br from-[#FFF7F7] to-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sold">
            Live Control
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-forest sm:text-xl">
            Run the auction &rarr;
          </p>
          <p className="mt-1 text-xs text-[#1B4332]/60">
            Draw players, capture bids, trigger SOLD moments.
          </p>
        </Link>
        <Link
          href={`/admin/${tournament.id}/registration`}
          className="rounded-2xl border border-[#1B4332]/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]">
            Registration
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-forest sm:text-xl">
            Configure the form &rarr;
          </p>
          <p className="mt-1 text-xs text-[#1B4332]/60">
            Edit fields, toggle open/closed, preview.
          </p>
        </Link>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        <Stat label="Players" value={playerCount} tone="forest" />
        <Stat label="Teams" value={teamsCount.count ?? 0} tone="forest" />
        <Stat label="Pending" value={pendingCount} tone="amber" />
        <Stat label="Sold" value={soldCount} tone="success" />
        <Stat label="Unsold" value={unsoldCount} tone="sold" />
      </section>

      <TournamentPosterCard
        tournamentId={tournament.id}
        currentPosterUrl={tournament.poster_url}
      />

      <section className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
          Share Links
        </h2>
        <p className="mt-1 text-xs text-[#1B4332]/60">
          Send these to organizers, players, and spectators.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
              Auction / Watch URL
            </p>
            <ReadOnlyUrlField value={auctionUrl} buttonLabel="Copy" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
              Registration URL
            </p>
            <ReadOnlyUrlField value={registerUrl} buttonLabel="Copy" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
          Export
        </h2>
        <p className="mt-1 text-xs text-[#1B4332]/60">
          Download player data or final squads.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/admin/tournaments/${tournament.id}/export`}
            className="rounded-lg border border-[#1B4332]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
          >
            ⬇ Players CSV
          </a>
          <ExportPdfButton tournamentId={tournament.id} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
          Auction Details
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 border-b border-[#1B4332]/10 pb-2 last:border-0 last:pb-0">
            <dt className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/50">
              Status
            </dt>
            <dd className="text-right">
              <TournamentStatusSelect
                tournamentId={tournament.id}
                current={tournament.status}
              />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-[#1B4332]/10 pb-2 last:border-0 last:pb-0">
            <dt className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/50">
              Registration
            </dt>
            <dd className="text-right">
              <TournamentRegistrationToggle
                tournamentId={tournament.id}
                current={tournament.registration_enabled}
              />
            </dd>
          </div>
          <Row label="Venue" value={tournament.venue ?? "—"} />
          <Row
            label="Start Time"
            value={
              tournament.auction_start_at
                ? format(
                    new Date(tournament.auction_start_at),
                    "MMM d, yyyy · h:mm a",
                  )
                : "—"
            }
          />
          <Row label="Public Slug" value={tournament.slug} mono />
          <Row label="Total Spent" value={`${totalSpent} pts`} />
          <Row label="Groups" value={String(groupsCount.count ?? 0)} />
        </dl>
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
  value: number;
  tone: "forest" | "sold" | "amber" | "success";
}) {
  const color =
    tone === "sold"
      ? "text-sold"
      : tone === "amber"
        ? "text-[#FFA000]"
        : tone === "success"
          ? "text-success"
          : "text-forest";
  return (
    <div className="rounded-xl border border-[#1B4332]/10 bg-white p-4 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-numeric)] text-2xl font-bold ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1B4332]/10 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/50">
        {label}
      </dt>
      <dd
        className={`text-right text-sm font-semibold text-forest ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}