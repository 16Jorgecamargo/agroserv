import { Skeleton } from '../ui/Skeleton'

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface" aria-hidden>
      <Skeleton className="aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}
