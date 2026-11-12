import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer, signInAsDemoProvider } from '../test/session'

describe('NotificationBell', () => {
  it('shows the unread count, opens the recent list and follows a link marking it read', async () => {
    signInAsDemoProducer()
    renderApp('/dashboard')

    await userEvent.click(await screen.findByRole('button', { name: 'Notificações, 1 não lidas' }))
    const panel = screen.getByRole('dialog', { name: 'Notificações recentes' })
    await userEvent.click(within(panel).getByRole('button', { name: /Você recebeu uma contraproposta/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Notificações' })).toBeInTheDocument()
    expect(getMockDatabase().notifications.find((notification) => notification.id === 'ntf-2')?.read).toBe(true)
  })

  it('links to the notifications page of the role', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/dashboard')

    await userEvent.click(await screen.findByRole('button', { name: /^Notificações/ }))
    expect(within(screen.getByRole('dialog', { name: 'Notificações recentes' })).getByRole('link', { name: 'Ver todas' })).toHaveAttribute('href', '/prestador/notificacoes')
  })
})

describe('NotificationsPage', () => {
  it('lists notifications and marks all as read updating the bell', async () => {
    signInAsDemoProducer()
    renderApp('/notificacoes')

    const list = await screen.findByRole('list', { name: 'Lista de notificações' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar todas como lidas' }))

    expect(await screen.findByText('Todas as notificações foram marcadas como lidas.')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Notificações' })).toBeInTheDocument()
  })

  it('paginates long lists', async () => {
    const database = getMockDatabase()
    for (let index = 0; index < 25; index += 1) {
      database.notifications.push({ id: `ntf-x${index}`, userId: 'usr-1', type: 'warning', title: `Aviso ${index}`, link: '/notificacoes', read: true, createdAt: new Date(2026, 0, 1, 0, index).toISOString() })
    }
    signInAsDemoProducer()
    renderApp('/notificacoes')

    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
  })
})
