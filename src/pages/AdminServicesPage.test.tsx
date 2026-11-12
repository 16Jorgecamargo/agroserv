import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'

describe('AdminServicesPage', () => {
  it('hides a service with a reason and shows it again', async () => {
    const title = getMockDatabase().services.find((service) => service.id === 'svc-1')!.title
    signInAsDemoAdmin()
    renderApp('/admin/anuncios?q=' + encodeURIComponent(title))

    const list = await screen.findByRole('list', { name: 'Lista de anúncios' })
    const item = within(list).getByRole('link', { name: title }).closest('li') as HTMLElement
    await userEvent.click(within(item).getByRole('button', { name: 'Ocultar' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Motivo do ocultamento (obrigatório)'), 'Fotos de outro prestador.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ocultar anúncio' }))

    expect(await screen.findByText('Motivo: Fotos de outro prestador.')).toBeInTheDocument()
    expect(getMockDatabase().services.find((service) => service.id === 'svc-1')?.status).toBe('hidden')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mostrar anúncio' }))

    expect(await screen.findByRole('button', { name: 'Ocultar' })).toBeInTheDocument()
    expect(getMockDatabase().services.find((service) => service.id === 'svc-1')?.status).toBe('active')
  })

  it('filters by status', async () => {
    getMockDatabase().services.find((service) => service.id === 'svc-5')!.status = 'paused'
    signInAsDemoAdmin()
    renderApp('/admin/anuncios')

    await screen.findByRole('list', { name: 'Lista de anúncios' })
    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'paused')

    expect(await screen.findByText('1 anúncio')).toBeInTheDocument()
  })
})
