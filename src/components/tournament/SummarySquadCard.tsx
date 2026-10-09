import type { Tables } from "@/types/supabase";

export function SummarySquadCard({
  team,
  players,
}: {
  team: Tables<"teams">;
  players: Tables<"players">[];
}) {
  const squad = players
    .filter((p) => p.sold_to_team_id === team.id)
    .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0));

  const initial = (team.team_name[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1B4332]/10 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#2D6A4F]/40 bg-mint text-base font-bold text-forest">
          {team.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.photo_url}
              alt={team.team_name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-forest">
            {team.team_name}
          </h3>
          {team.captain_name && (
            <p className="truncate text-xs text-[#1B4332]/60">
              {team.captain_name}
            </p>
          )}
        </div>
        <span className="whitespace-nowrap rounded-full bg-mint px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-forest">
          {team.points_remaining} pts left
        </span>
      </div>

      <div className="mt-4 flex-1 border-t border-[#1B4332]/10 pt-3">
        {squad.length === 0 ? (
          <p className="text-sm italic text-[#1B4332]/50">No players purchased.</p>
        ) : (
          <ul className="space-y-2">
            {squad.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-[#1B4332]/85">
                  {p.full_name}
                </span>
                <span className="whitespace-nowrap font-[family-name:var(--font-numeric)] font-bold text-sold">
                  {p.selling_price ?? 0} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 border-t border-[#1B4332]/10 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/50">
        {squad.length}
        {team.max_players != null ? ` / ${team.max_players}` : ""} players
      </p>
    </div>
  );
}