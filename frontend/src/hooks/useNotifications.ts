import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { subscribeMutations } from '../services/api/apiClient'
import { notificationService } from '../services/notificationService'
import type { NotificationList } from '../types/api'

export function useNotificationFeed(pageSize = 10) {
  const location = useLocation()
  const [feed, setFeed] = useState<NotificationList | null>(null)
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => subscribeMutations(refresh), [refresh])

  useEffect(() => {
    let active = true
    notificationService
      .list(1, pageSize)
      .then((result) => {
        if (active) setFeed(result)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [pageSize, location.pathname, location.search, version])

  return { feed, refresh }
}
