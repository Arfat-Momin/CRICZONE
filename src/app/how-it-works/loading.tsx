import { Skeleton } from "@/components/ui/skeleton";

export default function HowItWorksLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mb-14 text-center">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto mt-2 h-10 w-96 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="mb-10 h-1 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}