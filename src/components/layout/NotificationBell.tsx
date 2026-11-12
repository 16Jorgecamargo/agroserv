import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useNotificationFeed } from '../../hooks/useNotifications'
import { notificationService } from '../../services/notificationService'
import type { Notification, Role } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatRelativeTime } from '../../utils/format'
import { notificationsPathFor } from '../../routes/paths'

export function NotificationBell({ role }: { role: Role }) {
  const { feed, refresh } = useNotificationFeed(10)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const unread = feed?.unreadCount ?? 0

  useEffect(() => {
    if (!isOpen) return
    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  async function open(notification: Notification) {
    setIsOpen(false)
    if (!notification.read) await notificationService.markRead(notification.id).catch(() => undefined)
    navigate(notification.link)
  }

  async function markAll() {
    await notificationService.markAllRead().catch(() => undefined)
    refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={unread ? `Notificações, ${unread} não lidas` : 'Notificações'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="relative grid size-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] leading-[18px] font-bold text-white tabular-nums" aria-hidden>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="Notificações recentes"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-text">Notificações</p>
              {unread > 0 && (
                <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <CheckCheck className="size-3.5" aria-hidden />
                  Marcar todas como lidas
                </button>
              )}
            </div>
            {!feed || feed.data.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-muted">{feed ? 'Nenhuma notificação por aqui.' : 'Carregando…'}</p>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {feed.data.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void open(notification)}
                      className={cn('flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted', !notification.read && 'bg-primary-soft/40')}
                    >
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', notification.read ? 'bg-transparent' : 'bg-primary')} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-text">
                          {notification.title}
                          {!notification.read && <span className="sr-only"> (não lida)</span>}
                        </span>
                        {notification.body && <span className="block truncate text-xs text-text-muted">{notification.body}</span>}
                        <span className="block text-xs text-text-muted">{formatRelativeTime(notification.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to={notificationsPathFor(role)} onClick={() => setIsOpen(false)} className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-surface-muted">
              Ver todas
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
