import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentLoading() {
  return (
    <>
      <div className="border-b border-[#1B4332]/10 bg-gradient-to-b from-[#D8F3DC]/45 via-[#FDFCF0] to-transparent">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-12 w-96 max-w-full" />
          <Skeleton className="mt-4 h-4 w-64" />
          <div className="mt-8 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  );
}