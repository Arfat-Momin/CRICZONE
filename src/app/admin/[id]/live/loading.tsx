import { Skeleton } from "@/components/ui/skeleton";

export default function LiveLoading() {
  return (
    <main className="min-h-screen w-full bg-[#FDFCF0]">
      <header className="border-b border-[#1B4332]/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="h-8 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}