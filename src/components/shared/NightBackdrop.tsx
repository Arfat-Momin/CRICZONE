/**
 * CRICZONE — NightBackdrop
 *
 * Reusable dark wrapper for public tournament pages. Provides the deep
 * night base + two soft ambient glows. No blur filters, no mix-blend,
 * no backdrop-filter — safe for smooth scrolling.
 *
 * Place it as the outermost element of a page layout.
 */
export function NightBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#050A08] text-cream">
      {/* Ambient glows — fixed, non-interactive, behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 20% 0%, rgba(45,106,79,0.32), transparent 62%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(255,232,184,0.07), transparent 62%)",
          }}
        />
      </div>

      {/* Content above glows */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}