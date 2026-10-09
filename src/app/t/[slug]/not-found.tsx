import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-6xl font-bold text-forest">
          404
        </p>
        <p className="mt-3 max-w-md text-sm text-[#1B4332]/70">
          This tournament doesn&apos;t exist, is not public yet, or the link has
          expired.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-forest px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-[#2D6A4F]"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}