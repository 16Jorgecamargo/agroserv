import { useEffect, useState } from 'react'
import { getMockFileId, isMockFileUrl, readMockFile } from '../services/api/mockFileStore'

interface ResolvedFile {
  source: string
  url: string | null
}

export function useFileUrl(source: string | undefined): { url: string | undefined; isResolving: boolean; failed: boolean } {
  const [resolved, setResolved] = useState<ResolvedFile | null>(null)
  const needsResolution = isMockFileUrl(source)

  useEffect(() => {
    if (!isMockFileUrl(source)) return
    let active = true
    readMockFile(getMockFileId(source))
      .then((url) => {
        if (active) setResolved({ source, url: url ?? null })
      })
      .catch(() => {
        if (active) setResolved({ source, url: null })
      })
    return () => {
      active = false
    }
  }, [source])

  if (!source) return { url: undefined, isResolving: false, failed: false }
  if (!needsResolution) return { url: source, isResolving: false, failed: false }

  const current = resolved?.source === source ? resolved : null
  return { url: current?.url ?? undefined, isResolving: !current, failed: current?.url === null }
}
