import { Skeleton } from '../ui/Skeleton'

export function ServiceCardSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="px-0.5 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-3/5 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
        <Skeleton className="mt-2.5 h-4 w-1/2 rounded-md" />
        <Skeleton className="mt-2 h-4 w-2/5 rounded-md" />
        <Skeleton className="mt-4 h-5 w-1/3 rounded-md" />
      </div>
    </div>
  )
}
