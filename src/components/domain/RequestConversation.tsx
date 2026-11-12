import { Lock, MessageSquare, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../hooks/useAuth'
import { isApiError } from '../../services/apiError'
import { messageService } from '../../services/messageService'
import type { Role } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import { Button } from '../ui/Button'

const roleLabels: Record<Role, string> = { producer: 'Produtor', provider: 'Prestador', admin: 'Administração' }
const MAX_LENGTH = 2000

interface RequestConversationProps {
  requestId: string
  isOpen: boolean
  readOnly?: boolean
  onClosedConflict?: () => void
}

export function RequestConversation({ requestId, isOpen, readOnly = false, onClosedConflict }: RequestConversationProps) {
  const { user } = useAuth()
  const fetcher = useCallback(() => messageService.list(requestId), [requestId])
  const { data, error, refetch } = useAsync(fetcher)
  const [text, setText] = useState('')
  const [sendError, setSendError] = useState<string>()
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)
  const canWrite = isOpen && !readOnly

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [data])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = text.trim()
    if (isSending) return
    if (!trimmed || trimmed.length > MAX_LENGTH) {
      setSendError('Escreva uma mensagem de até 2000 caracteres.')
      return
    }

    setIsSending(true)
    setSendError(undefined)
    try {
      await messageService.send(requestId, trimmed)
      setText('')
      refetch()
    } catch (caught) {
      setSendError(isApiError(caught) ? (caught.fields?.text ?? caught.message) : 'Não foi possível enviar a mensagem.')
      if (isApiError(caught) && caught.status === 409) onClosedConflict?.()
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section aria-labelledby="conversation-heading" className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 id="conversation-heading" className="flex items-center gap-2 text-xl font-semibold text-text">
        <MessageSquare className="size-5 text-primary" aria-hidden />
        Conversa
      </h2>

      {error && !data ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error.message}
        </p>
      ) : !data ? (
        <p role="status" className="mt-4 text-sm text-text-muted">
          Carregando conversa…
        </p>
      ) : data.length === 0 ? (
        <p className="mt-4 rounded-lg bg-surface-muted p-4 text-sm text-text-muted">
          {canWrite ? 'Nenhuma mensagem ainda. Combine os detalhes do serviço por aqui.' : 'Nenhuma mensagem nesta solicitação.'}
        </p>
      ) : (
        <ol ref={listRef} aria-label="Mensagens" className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {data.map((message) => {
            const isOwn = message.senderId === user?.id
            return (
              <li key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5', isOwn ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-surface-muted text-text')}>
                  <p className={cn('text-xs font-semibold', isOwn ? 'text-white/80' : 'text-text-muted')}>
                    {isOwn ? 'Você' : message.senderName} · {roleLabels[message.senderRole]}
                  </p>
                  <p className="mt-0.5 text-sm whitespace-pre-line break-words">{message.text}</p>
                  <time dateTime={message.createdAt} className={cn('mt-1 block text-[11px]', isOwn ? 'text-white/70' : 'text-text-muted')}>
                    {formatDateTime(message.createdAt)}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {canWrite ? (
        <form noValidate onSubmit={submit} className="mt-4 space-y-2">
          <label htmlFor="conversation-message" className="sr-only">
            Mensagem
          </label>
          <textarea
            id="conversation-message"
            rows={3}
            maxLength={MAX_LENGTH}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setSendError(undefined)
            }}
            placeholder="Escreva uma mensagem"
            aria-invalid={sendError ? true : undefined}
            aria-describedby="conversation-counter"
            className="block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span id="conversation-counter" className="text-xs text-text-muted tabular-nums">
              {text.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" size="sm" isLoading={isSending}>
              <Send className="size-4" aria-hidden />
              Enviar
            </Button>
          </div>
          {sendError && (
            <p role="alert" className="text-sm text-danger">
              {sendError}
            </p>
          )}
        </form>
      ) : (
        !readOnly && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-surface-muted p-3 text-sm text-text-muted">
            <Lock className="size-4" aria-hidden />
            Esta conversa está encerrada.
          </p>
        )
      )}
    </section>
  )
}
