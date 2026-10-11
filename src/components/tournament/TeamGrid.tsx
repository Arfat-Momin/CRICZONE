import type { Tables } from "@/types/supabase";
import { ZoomableImage } from "@/components/shared/ZoomableImage";

export function TeamGrid({ teams }: { teams: Tables<"teams">[] }) {
  if (teams.length === 0) return null;

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-cream text-glow-mint md:text-3xl">
        Teams &amp; Captains
      </h2>
      <p className="mt-1 text-sm text-cream/55">
        {teams.length} team{teams.length === 1 ? "" : "s"} competing
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {teams.map((t) => {
          const initial = (t.team_name[0] ?? "?").toUpperCase();
          const photo =
            t.photo_url ||
            `https://placehold.co/200x200/0A1410/D8F3DC?text=${encodeURIComponent(initial)}`;
          return (
            <div
              key={t.id}
              className="rounded-2xl border border-mint/12 bg-[#0A1410] p-4 text-center shadow-[0_0_30px_-16px_rgba(216,243,220,0.25)] transition hover:-translate-y-1 hover:border-mint/35"
            >
              <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-mint/35 shadow-[0_0_18px_-6px_rgba(216,243,220,0.4)]">
                <ZoomableImage
                  src={photo}
                  alt={t.team_name}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-bold text-cream">
                {t.team_name}
              </p>
              <p className="truncate text-xs text-cream/55">
                {t.captain_name ?? "—"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}