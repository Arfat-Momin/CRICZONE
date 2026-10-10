"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreatePlayerAction } from "@/lib/actions/player";
import { PhotoDropzone } from "@/components/tournament/PhotoDropzone";

type Props = {
  tournamentId: string;
  onSuccess: () => void;
};

export function CreatePlayerForm({ tournamentId, onSuccess }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [mobile, setMobile] = useState("");
  const [jerseyNo, setJerseyNo] = useState("");
  const [jerseySize, setJerseySize] = useState("");
  const [category, setCategory] = useState("");
  const [currentTeam, setCurrentTeam] = useState("");
  const [basePrice, setBasePrice] = useState("1");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await adminCreatePlayerAction({
        tournamentId,
        firstName,
        surname,
        mobileNo: mobile,
        jerseyNo: jerseyNo ? Number.parseInt(jerseyNo, 10) : null,
        jerseySize: jerseySize || null,
        category: category || null,
        currentTeam: currentTeam || null,
        basePrice: Number.parseFloat(basePrice) || 1,
        photoInput: photo,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-3 py-2 text-sm text-forest outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20";

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#1B4332]/70">
            First Name <span className="text-sold">*</span>
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputCls}
            disabled={busy}
            required
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
          placeholder="10 digits"
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
          Player Photo (optional)
        </label>
        <PhotoDropzone value={photo} onChange={setPhoto} />
      </div>

      {error && (
        <p className="rounded-lg border border-sold/30 bg-sold/10 px-3 py-2 text-xs font-semibold text-sold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || (!firstName.trim() && !surname.trim())}
        className="w-full rounded-lg bg-forest px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cream transition hover:bg-[#2D6A4F] disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add Player"}
      </button>
    </form>
  );
}