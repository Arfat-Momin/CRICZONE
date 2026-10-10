"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { importPlayersAction, importTeamsAction } from "@/lib/actions/import-season";

type Option = { id: string; label: string };

type Props = {
  targetTournamentId: string;
  onClose: () => void;
};

type Tab = "players" | "teams";

export function ImportFromSeasonModal({ targetTournamentId, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("players");
  const [seasons, setSeasons] = useState<Option[] | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [items, setItems] = useState<Option[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // Load tournament list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: e } = await supabase
        .from("tournaments")
        .select("id, name")
        .neq("id", targetTournamentId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (e) {
        setError(e.message);
        setSeasons([]);
        return;
      }
      setSeasons((data ?? []).map((t) => ({ id: t.id, label: t.name })));
    })();
    return () => {
      cancelled = true;
    };
  }, [targetTournamentId]);

  // Load items for the selected source + tab
  useEffect(() => {
    if (!sourceId) {
      setItems(null);
      setSelected(new Set());
      setSearch("");
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      if (tab === "players") {
        const { data, error: e } = await supabase
          .from("players")
          .select("id, full_name")
          .eq("tournament_id", sourceId)
          .order("full_name", { ascending: true });
        if (cancelled) return;
        if (e) {
          setError(e.message);
          setItems([]);
          return;
        }
        setItems((data ?? []).map((p) => ({ id: p.id, label: p.full_name })));
      } else {
        const { data, error: e } = await supabase
          .from("teams")
          .select("id, team_name")
          .eq("tournament_id", sourceId)
          .order("team_name", { ascending: true });
        if (cancelled) return;
        if (e) {
          setError(e.message);
          setItems([]);
          return;
        }
        setItems((data ?? []).map((t) => ({ id: t.id, label: t.team_name })));
      }
      setSelected(new Set());
      setSearch("");
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceId, tab]);

  const visibleItems = (items ?? []).filter((it) => {
    if (!search.trim()) return true;
    return it.label.toLowerCase().includes(search.trim().toLowerCase());
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const it of visibleItems) next.add(it.id);
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function onImport() {
    if (!sourceId || selected.size === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const ids = Array.from(selected);
      const r =
        tab === "players"
          ? await importPlayersAction({
              targetTournamentId,
              sourceTournamentId: sourceId,
              playerIds: ids,
            })
          : await importTeamsAction({
              targetTournamentId,
              sourceTournamentId: sourceId,
              teamIds: ids,
            });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult(r.data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#0F231A]/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Import from another tournament
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-[#1B4332]/10">
          <button
            type="button"
            onClick={() => {
              setTab("players");
              setResult(null);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === "players"
                ? "border-[#2D6A4F] text-[#2D6A4F]"
                : "border-transparent text-[#1B4332]/50 hover:text-forest"
            }`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("teams");
              setResult(null);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === "teams"
                ? "border-[#2D6A4F] text-[#2D6A4F]"
                : "border-transparent text-[#1B4332]/50 hover:text-forest"
            }`}
          >
            Teams
          </button>
        </div>

        {/* Source select */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            Source Tournament
          </label>
          {seasons === null ? (
            <p className="text-xs text-[#1B4332]/50">Loading tournaments…</p>
          ) : seasons.length === 0 ? (
            <p className="text-xs text-[#1B4332]/50">
              No other tournaments found to import from.
            </p>
          ) : (
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm"
            >
              <option value="">— Select a tournament —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Item list */}
        {sourceId && items !== null && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                {tab === "players" ? "Players" : "Teams"} ({selected.size} selected)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={busy}
                  className="rounded-md border border-success/40 bg-mint px-2 py-1 text-[10px] font-bold text-success hover:bg-mint/70 disabled:opacity-50"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={busy || selected.size === 0}
                  className="rounded-md border border-sold/40 bg-sold/10 px-2 py-1 text-[10px] font-bold text-sold hover:bg-sold/20 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="mt-2 w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm outline-none focus:border-[#2D6A4F]"
              disabled={busy}
            />

            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-[#1B4332]/15 bg-[#FAFDF9] p-2">
              {items.length === 0 ? (
                <p className="p-3 text-center text-xs text-[#1B4332]/50">
                  Nothing to import from this tournament.
                </p>
              ) : visibleItems.length === 0 ? (
                <p className="p-3 text-center text-xs text-[#1B4332]/50">
                  No matches.
                </p>
              ) : (
                visibleItems.map((it) => (
                  <label
                    key={it.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                      selected.has(it.id)
                        ? "border-success bg-mint"
                        : "border-[#1B4332]/10 bg-white hover:border-[#2D6A4F]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(it.id)}
                      disabled={busy}
                      onChange={() => toggle(it.id)}
                      className="h-3.5 w-3.5 accent-[#1B4332]"
                    />
                    <span className="flex-1 truncate font-semibold text-forest">
                      {it.label}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-3 rounded-lg border border-success/30 bg-mint px-3 py-3 text-xs">
            <p className="font-bold text-success">
              Imported {result.imported} · Skipped {result.skipped}
              {result.errors.length > 0 && ` · Errors ${result.errors.length}`}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-[11px] text-sold">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
                {result.errors.length > 5 && (
                  <li className="italic">…and {result.errors.length - 5} more.</li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-[#1B4332]/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1B4332]/70 transition hover:bg-mint"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={busy || !sourceId || selected.size === 0}
            className="flex-1 rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${selected.size} item${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}