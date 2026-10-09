"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
};

export function LoginForm({ nextPath }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-semibold text-[#1B4332]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-4 py-2.5 text-[#1B4332] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-semibold text-[#1B4332]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[#1B4332]/20 bg-[#FDFCF0] px-4 py-2.5 text-[#1B4332] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#C1121F]/30 bg-[#C1121F]/10 px-4 py-2 text-sm font-medium text-[#C1121F]"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#1B4332] px-4 py-3 font-semibold text-[#FDFCF0] transition hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}