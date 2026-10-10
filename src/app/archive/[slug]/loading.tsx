import { Skeleton } from "@/components/ui/skeleton";

export default function ArchiveDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="text-center">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto mt-4 h-12 w-96 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />
      </div>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-14 h-8 w-64" />
      <Skeleton className="mt-4 h-96 w-full rounded-2xl" />
    </div>
  );
}