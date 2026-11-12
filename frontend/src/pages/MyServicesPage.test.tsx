import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'

function serviceRecord(id: string) {
  const record = getMockDatabase().services.find((candidate) => candidate.id === id)
  if (!record) throw new Error(`${id} missing`)
  return record
}

describe('MyServicesPage', () => {
  it('lists own services with status and the hidden reason', async () => {
    Object.assign(serviceRecord('svc-5'), { status: 'hidden', hiddenReason: 'Fotos repetidas.' })
    signInAsDemoProvider()
    renderApp('/prestador/servicos')

    const list = await screen.findByRole('list', { name: 'Lista de serviços' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('Oculto pela administração')).toBeInTheDocument()
    expect(within(list).getByText('Motivo: Fotos repetidas.')).toBeInTheDocument()
    expect(within(list).queryByRole('button', { name: /^Reativar/ })).not.toBeInTheDocument()
  })

  it('pauses and reactivates a service', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos')

    await userEvent.click(await screen.findByRole('button', { name: 'Pausar Pulverização Agrícola' }))
    expect(await screen.findByText('Anúncio pausado. Ele saiu da busca.')).toBeInTheDocument()
    expect(serviceRecord('svc-1').status).toBe('paused')

    await userEvent.click(await screen.findByRole('button', { name: 'Reativar Pulverização Agrícola' }))
    expect(await screen.findByText('Anúncio reativado. Ele voltou para a busca.')).toBeInTheDocument()
    expect(serviceRecord('svc-1').status).toBe('active')
  })

  it('explains that a service with open requests cannot be deleted', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos')

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Pulverização Agrícola' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.')).toBeInTheDocument()
    expect(serviceRecord('svc-1').deletedAt).toBeUndefined()
  })

  it('publishes a new service with a photo', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos/novo')

    await userEvent.type(await screen.findByLabelText('Título'), 'Colheita de milho safrinha')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'cat-harvest')
    await userEvent.type(screen.getByLabelText('Descrição'), 'Colheitadeira com plataforma de milho e transbordo.')
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '320')
    await userEvent.upload(screen.getByLabelText('Adicionar fotos (8 restantes)'), new File([new Uint8Array([1, 2])], 'milho.png', { type: 'image/png' }))
    expect(await screen.findByRole('button', { name: 'Remover foto 1' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Publicar serviço' }))

    expect(await screen.findByText('Serviço publicado. Ele já aparece na busca.')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Colheita de milho safrinha' })).toBeInTheDocument()
    const created = getMockDatabase().services.at(-1)
    expect(created).toMatchObject({ title: 'Colheita de milho safrinha', status: 'active', priceUnit: 'hectare', city: 'Santa Helena' })
    expect(created?.photos[0]).toMatch(/^mockfile:/)
  })

  it('shows validation before publishing', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos/novo')

    await userEvent.click(await screen.findByRole('button', { name: 'Publicar serviço' }))

    expect(screen.getByText('Informe o título.')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument()
    expect(screen.getByText('Informe o preço.')).toBeInTheDocument()
  })

  it('edits an existing service', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos/svc-5/editar')

    const title = await screen.findByLabelText('Título')
    await userEvent.clear(title)
    await userEvent.type(title, 'Fertilização com taxa variável')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Anúncio atualizado.')).toBeInTheDocument()
    expect(serviceRecord('svc-5').title).toBe('Fertilização com taxa variável')
  })

  it('shows not found when editing someone else service', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos/svc-2/editar')

    expect(await screen.findByRole('heading', { name: 'Serviço não encontrado' })).toBeInTheDocument()
  })
})
