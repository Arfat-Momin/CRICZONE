"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdatePlayerAction } from "@/lib/actions/player";
import { PhotoDropzone } from "@/components/tournament/PhotoDropzone";
import type { Tables } from "@/types/supabase";

type AdminPlayer = Tables<"players"> & { mobile_no: string | null };

type Props = {
  player: AdminPlayer;
  tournamentId: string;
  onClose: () => void;
};

export function EditPlayerModal({ player, tournamentId, onClose }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(player.first_name ?? "");
  const [surname, setSurname] = useState(player.surname ?? "");
  const [mobile, setMobile] = useState(player.mobile_no ?? "");
  const [jerseyNo, setJerseyNo] = useState(
    player.jersey_no != null ? String(player.jersey_no) : "",
  );
  const [jerseySize, setJerseySize] = useState(player.jersey_size ?? "");
  const [category, setCategory] = useState(player.category ?? "");
  const [currentTeam, setCurrentTeam] = useState(player.current_team ?? "");
  const [basePrice, setBasePrice] = useState(String(player.base_price ?? 1));
  const [photo, setPhoto] = useState<string | null>(null);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await adminUpdatePlayerAction({
        playerId: player.id,
        tournamentId,
        firstName,
        surname,
        mobileNo: mobile,
        jerseyNo: jerseyNo ? Number.parseInt(jerseyNo, 10) : null,
        jerseySize: jerseySize || null,
        category: category || null,
        currentTeam: currentTeam || null,
        basePrice: Number.parseFloat(basePrice) || 1,
        photoDataUrl: photo,
        clearPhoto,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#0F231A]/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-xl rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-forest">
            Edit {player.full_name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332]/10 text-lg font-bold text-forest transition hover:bg-sold hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
                disabled={busy}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Surname
              </label>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className={inputCls}
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
              Mobile Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              className={inputCls}
              disabled={busy}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Jersey No
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={jerseyNo}
                onChange={(e) => setJerseyNo(e.target.value)}
                className={inputCls}
                disabled={busy}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Size
              </label>
              <select
                value={jerseySize}
                onChange={(e) => setJerseySize(e.target.value)}
                className={inputCls}
                disabled={busy}
              >
                <option value="">—</option>
                {["S", "M", "L", "XL", "XXL", "3XL"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
                disabled={busy}
              >
                <option value="">—</option>
                {["Batsman", "Bowler", "All-Rounder", "WK-Keeper"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
                Base Price
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={inputCls}
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
              Current Team
            </label>
            <input
              value={currentTeam}
              onChange={(e) => setCurrentTeam(e.target.value)}
              className={inputCls}
              disabled={busy}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
              Photo
            </label>
            {player.photo_url && !clearPhoto && !photo && (
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#1B4332]/10 bg-[#FAFDF9] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={player.photo_url}
                  alt=""
                  className="h-12 w-12 rounded-full border border-[#1B4332]/15 object-cover object-top"
                />
                <span className="flex-1 text-xs text-[#1B4332]/60">
                  Current photo
                </span>
                <button
                  type="button"
                  onClick={() => setClearPhoto(true)}
                  className="text-xs font-bold text-sold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            {clearPhoto && (
              <p className="mb-2 text-xs font-semibold text-sold">
                Photo will be removed on save.{" "}
                <button
                  type="button"
                  onClick={() => setClearPhoto(false)}
                  className="underline"
                >
                  Undo
                </button>
              </p>
            )}
            <PhotoDropzone value={photo} onChange={setPhoto} />
          </div>

          {error && (
            <p className="rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#1B4332]/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1B4332]/70 transition hover:bg-mint"
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}