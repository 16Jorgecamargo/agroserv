import { Loader2 } from 'lucide-react'

export function FullScreenLoader() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-bg">
      <span className="flex items-center gap-3 text-sm text-text-muted">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        Carregando…
      </span>
    </div>
  )
}
