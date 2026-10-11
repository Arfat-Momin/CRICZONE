const ITEMS = [
  "⚡ Live turf cricket auctions",
  "🏏 Real-time bidding in under a second",
  "🏆 Run multiple tournaments at once",
  "📺 Projection mode for venue screens",
  "🔒 One mobile per player, per tournament",
  "🎬 Cinematic SOLD & UNSOLD moments",
  "🌍 Share one link — the world watches",
];

export function ScoreboardTicker() {
  // Duplicate items so the CSS marquee loops seamlessly.
  const loop = [...ITEMS, ...ITEMS];

  return (
    <section
      aria-label="CRICZONE highlights"
      className="relative overflow-hidden border-y border-mint/10 bg-[#050A08] py-3"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050A08] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050A08] to-transparent" />

      <div className="cz-marquee-track">
        {loop.map((t, i) => (
          <span
            key={i}
            className="whitespace-nowrap px-6 text-[11px] font-extrabold uppercase tracking-[0.28em] text-cream/70 md:text-xs"
          >
            {t}
            <span aria-hidden className="ml-6 inline-block text-mint/50">
              ●
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}