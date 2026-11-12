import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

function visibleCountIn(city: string): number {
  return getMockDatabase().services.filter((service) => service.city === city && service.status === 'active').length
}

describe('services map', () => {
  it('switches to the map and shows one marker per city with the service count', async () => {
    renderApp('/servicos')

    await userEvent.click(await screen.findByRole('button', { name: 'Mapa' }))

    const map = await screen.findByRole('region', { name: 'Mapa de serviços por cidade' })
    const markers = within(within(map).getByRole('list', { name: 'Marcadores do mapa' })).getAllByRole('listitem')
    expect(markers.map((marker) => marker.textContent)).toContain(`Toledo - PR: ${visibleCountIn('Toledo')}`)
    expect(screen.getByRole('button', { name: 'Mapa' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Escolha uma cidade no mapa ou na lista para ver os serviços dela.')).toBeInTheDocument()
  })

  it('lists the services of the chosen city', async () => {
    renderApp('/servicos?view=map')

    const cities = await screen.findByRole('list', { name: 'Cidades com serviços' })
    await userEvent.click(within(cities).getByRole('button', { name: /Palotina - PR/ }))

    const section = await screen.findByRole('region', { name: 'Serviços em Palotina - PR' })
    const expectedTitles = getMockDatabase()
      .services.filter((service) => service.city === 'Palotina' && service.status === 'active')
      .map((service) => service.title)
    expectedTitles.forEach((title) => expect(within(section).getByRole('heading', { name: title })).toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Pulverização Agrícola' })).not.toBeInTheDocument()
  })

  it('leaves cities outside the table off the map', async () => {
    const service = getMockDatabase().services.find((candidate) => candidate.id === 'svc-7')!
    service.city = 'Cidade Inventada'
    renderApp('/servicos?view=map')

    expect(await screen.findByText('1 serviço está em cidades fora do mapa.')).toBeInTheDocument()
    const markers = within(screen.getByRole('list', { name: 'Marcadores do mapa' })).getAllByRole('listitem')
    expect(markers.some((marker) => marker.textContent?.includes('Cidade Inventada'))).toBe(false)
  })
})

describe('service area', () => {
  it('draws the service radius on the public provider profile', async () => {
    renderApp('/prestadores/prv-1')

    const map = await screen.findByRole('region', { name: 'Área de atendimento de Agro Máquinas Paraná' })
    expect(within(map).getByText('Raio de 100 km')).toBeInTheDocument()
    expect(screen.getByText('Raio de 100 km a partir de Santa Helena - PR.')).toBeInTheDocument()
  })

  it('warns without blocking when the property is outside the radius', async () => {
    getMockDatabase().providerProfiles.find((profile) => profile.userId === 'prv-2')!.serviceRadiusKm = 30
    signInAsDemoProducer()
    renderApp('/servicos/svc-2')

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar serviço' }))
    const dialog = await screen.findByRole('dialog', { name: 'Solicitar serviço' })
    const select = await within(dialog).findByLabelText('Propriedade')
    await userEvent.selectOptions(select, 'prop-1')

    expect(within(dialog).getByText('Sua propriedade pode estar fora da área de atendimento')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Enviar solicitação' })).toBeEnabled()
  })

  it('stays quiet when the property is inside the radius', async () => {
    signInAsDemoProducer()
    renderApp('/servicos/svc-2')

    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar serviço' }))
    const dialog = await screen.findByRole('dialog', { name: 'Solicitar serviço' })
    await userEvent.selectOptions(await within(dialog).findByLabelText('Propriedade'), 'prop-1')

    expect(within(dialog).queryByText('Sua propriedade pode estar fora da área de atendimento')).not.toBeInTheDocument()
  })
})
