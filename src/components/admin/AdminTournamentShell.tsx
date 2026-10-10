"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ShellTournament = {
  id: string;
  name: string;
  slug: string;
  status: string;
  venue: string | null;
};

const STATUS_CLS: Record<string, string> = {
  draft: "bg-[#1B4332]/10 text-[#1B4332]",
  registration: "bg-mint text-forest",
  ready: "bg-[#FFA000] text-white",
  live: "bg-sold text-white",
  ended: "bg-[#1B4332]/10 text-[#1B4332]",
  archived: "bg-[#1B4332]/10 text-[#1B4332]",
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  accent?: boolean;
  danger?: boolean;
};

export function AdminTournamentShell({
  tournament,
  children,
}: {
  tournament: ShellTournament;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/admin/${tournament.id}`;

  const navItems: NavItem[] = [
    { href: base, label: "Overview", icon: "📊", exact: true },
    { href: `${base}/teams`, label: "Teams", icon: "🏏" },
    { href: `${base}/players`, label: "Players", icon: "👥" },
    { href: `${base}/groups`, label: "Groups", icon: "🏷️" },
    { href: `${base}/registration`, label: "Registration", icon: "📋" },
    { href: `${base}/live`, label: "Live Control", icon: "🎯", accent: true },
    { href: `${base}/danger`, label: "Danger Zone", icon: "⚠️", danger: true },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const statusCls = STATUS_CLS[tournament.status] ?? STATUS_CLS.draft;
  const publicUrl = `/t/${tournament.slug}`;

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="sticky top-0 z-30 border-b border-[#1B4332]/10 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] hover:underline"
            >
              ← All Tournaments
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${statusCls}`}
              >
                {tournament.status}
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[#1B4332]/20 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-forest transition hover:bg-mint"
              >
                Open Public ↗
              </a>
            </div>
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-forest md:text-3xl">
            {tournament.name}
          </h1>
          {tournament.venue && (
            <p className="mt-1 text-xs text-[#1B4332]/60">
              📍 {tournament.venue}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6 md:py-8">
        <nav className="md:sticky md:top-32 md:w-56 md:shrink-0 md:self-start">
          <ul className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const baseCls =
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition";
              let colorCls = "text-[#1B4332]/70 hover:bg-mint hover:text-forest";
              if (active) colorCls = "bg-forest text-cream";
              else if (item.danger) colorCls = "text-sold hover:bg-sold/10";
              else if (item.accent) colorCls = "text-[#2D6A4F] hover:bg-mint";
              return (
                <li key={item.href} className="shrink-0">
                  <Link href={item.href} prefetch={true} className={`${baseCls} ${colorCls}`}>
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}