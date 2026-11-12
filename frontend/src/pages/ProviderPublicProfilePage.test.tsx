import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'

describe('ProviderPublicProfilePage', () => {
  it('opens from the service detail and shows the provider profile', async () => {
    renderApp('/servicos/svc-1')

    await userEvent.click(await screen.findByRole('link', { name: 'Agro Máquinas Paraná' }))

    expect(await screen.findByRole('heading', { level: 1, name: /Agro Máquinas Paraná/ })).toBeInTheDocument()
    expect(screen.getByText(/Atende até \d+ km/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Serviços' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Equipamentos' })).toBeInTheDocument()
    expect(screen.getByText('Jacto Uniport 3030')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avaliações' })).toBeInTheDocument()
  })

  it('explains when the provider left the platform', async () => {
    getMockDatabase().users.find((user) => user.id === 'prv-2')!.status = 'suspended'
    renderApp('/prestadores/prv-2')

    expect(await screen.findByText('Prestador não está mais na plataforma.')).toBeInTheDocument()
  })
})
