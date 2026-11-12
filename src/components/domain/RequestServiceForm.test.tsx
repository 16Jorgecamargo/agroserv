import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../../services/api/mockDatabase'
import { addDays, getTodayInBrasilia } from '../../utils/date'
import { renderApp } from '../../test/renderApp'
import { signInAsDemoAdmin, signInAsDemoProducer, signInAsDemoProvider } from '../../test/session'

async function openForm() {
  await userEvent.click(await screen.findByRole('button', { name: 'Solicitar serviço' }))
  return screen.getByRole('dialog')
}

describe('Request a service', () => {
  it('sends a request with a live estimate and links to its detail', async () => {
    signInAsDemoProducer()
    renderApp('/servicos/svc-1')
    const dialog = await openForm()

    await userEvent.selectOptions(await within(dialog).findByLabelText('Propriedade'), 'prop-1')
    await userEvent.type(within(dialog).getByLabelText('Data desejada'), addDays(getTodayInBrasilia(), 5))
    await userEvent.type(within(dialog).getByLabelText('Quantidade (horas)'), '6')
    expect(within(dialog).getByText('R$ 1.080,00')).toBeInTheDocument()
    expect(within(dialog).getByText('Valor estimado. O acerto é feito diretamente com o prestador.')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar solicitação' }))

    expect(await within(dialog).findByText('Solicitação enviada')).toBeInTheDocument()
    const created = getMockDatabase().requestRecords.at(-1)?.request
    expect(created).toMatchObject({ serviceId: 'svc-1', status: 'pending', quantity: 6, value: 1080 })
    expect(within(dialog).getByRole('link', { name: 'Ver solicitação' })).toHaveAttribute('href', `/solicitacoes/${created?.id}`)
    expect(getMockDatabase().notifications.at(-1)).toMatchObject({ userId: 'prv-1', type: 'request_created' })
  })

  it('creates the first property inside the form', async () => {
    getMockDatabase().properties = []
    signInAsDemoProducer()
    renderApp('/servicos/svc-1')
    const dialog = await openForm()

    await userEvent.type(await within(dialog).findByLabelText('Nome da propriedade'), 'Sítio Novo')
    await userEvent.type(within(dialog).getByLabelText('Área (hectares)'), '50')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar propriedade' }))

    const select = await within(dialog).findByLabelText('Propriedade')
    expect(select).toHaveValue(getMockDatabase().properties.at(-1)?.id)
    expect(within(select).getByRole('option', { name: /Sítio Novo/ })).toBeInTheDocument()
  })

  it('validates required fields before sending', async () => {
    signInAsDemoProducer()
    renderApp('/servicos/svc-1')
    const dialog = await openForm()

    await userEvent.click(await within(dialog).findByRole('button', { name: 'Enviar solicitação' }))

    expect(within(dialog).getByText('Selecione uma propriedade.')).toBeInTheDocument()
    expect(within(dialog).getByText('Escolha uma data a partir de hoje.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe a quantidade.')).toBeInTheDocument()
  })

  it('does not let a producer request an unavailable service', async () => {
    getMockDatabase().services.find((service) => service.id === 'svc-1')!.available = false
    signInAsDemoProducer()
    renderApp('/servicos/svc-1')

    expect(await screen.findByRole('button', { name: 'Solicitar serviço' })).toBeDisabled()
    expect(screen.getByText('Este serviço não está disponível para novas solicitações.')).toBeInTheDocument()
  })

  it('hides the request button from providers and admins', async () => {
    signInAsDemoProvider()
    const { unmount } = renderApp('/servicos/svc-2')
    expect(await screen.findByRole('heading', { level: 1, name: 'Colheita de Soja e Milho' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar serviço' })).not.toBeInTheDocument()
    unmount()

    signInAsDemoAdmin()
    renderApp('/servicos/svc-2')
    expect(await screen.findByRole('heading', { level: 1, name: 'Colheita de Soja e Milho' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solicitar serviço' })).not.toBeInTheDocument()
  })
})
