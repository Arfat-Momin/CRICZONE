import type { Tables } from "@/types/supabase";

type Props = {
  players: Tables<"players">[];
  teams: Tables<"teams">[];
};

export function SummaryPlayerRankings({ players, teams }: Props) {
  const teamMap: Record<string, string> = {};
  for (const t of teams) teamMap[t.id] = t.team_name;

  const sold = players
    .filter((p) => p.status === "sold")
    .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0));

  if (sold.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1B4332]/20 bg-white/60 p-10 text-center text-sm text-[#1B4332]/60">
        No players were sold in this auction.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1B4332]/10 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[#1B4332]/10 bg-[#FAFDF9] text-[10px] font-extrabold uppercase tracking-wider text-[#1B4332]/60">
          <tr>
            <th className="w-12 px-4 py-3">#</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-4 py-3 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {sold.map((p, idx) => {
            const teamName = p.sold_to_team_id ? teamMap[p.sold_to_team_id] : undefined;
            return (
              <tr
                key={p.id}
                className="border-b border-[#1B4332]/5 last:border-0 hover:bg-[#FAFDF9]"
              >
                <td className="px-4 py-3 font-[family-name:var(--font-numeric)] font-bold text-[#1B4332]/50">
                  {idx + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_url}
                        alt=""
                        loading="lazy"
                        className="h-9 w-9 rounded-full border border-[#1B4332]/15 object-cover object-top"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[#1B4332]/10" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-forest">
                        {p.full_name}
                      </p>
                      {p.category && (
                        <p className="truncate text-xs text-[#1B4332]/50">
                          {p.category}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#1B4332]/75">{teamName ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-[family-name:var(--font-numeric)] font-bold text-sold">
                  {p.selling_price ?? 0} pts
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}