import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer, signInAsDemoProvider } from '../test/session'

describe('favorites', () => {
  it('toggles the heart on a service card for producers', async () => {
    signInAsDemoProducer()
    renderApp('/servicos')

    const title = getMockDatabase().services.find((service) => service.id === 'svc-1')!.title
    const heart = await screen.findByRole('button', { name: `Adicionar ${title} aos favoritos` })
    await userEvent.click(heart)

    expect(await screen.findByRole('button', { name: `Remover ${title} dos favoritos` })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(getMockDatabase().favorites.some((favorite) => favorite.serviceId === 'svc-1')).toBe(true))
  })

  it('sends visitors to the login', async () => {
    renderApp('/servicos')

    const hearts = await screen.findAllByRole('button', { name: /aos favoritos$/ })
    await userEvent.click(hearts[0])

    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
  })

  it('hides the heart from providers', async () => {
    signInAsDemoProvider()
    renderApp('/servicos')

    await screen.findAllByRole('article')
    expect(screen.queryByRole('button', { name: /favoritos$/ })).not.toBeInTheDocument()
  })

  it('lists favorites and removes them from the page', async () => {
    signInAsDemoProducer()
    renderApp('/favoritos')

    const list = await screen.findByRole('list', { name: 'Serviços favoritos' })
    const heart = await within(list).findByRole('button', { name: /dos favoritos$/ })
    await userEvent.click(heart)

    expect(await screen.findByText('Nenhum favorito ainda')).toBeInTheDocument()
  })
})
