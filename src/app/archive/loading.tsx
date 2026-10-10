import { Skeleton } from "@/components/ui/skeleton";

export default function ArchiveLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-3 h-12 w-80" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}