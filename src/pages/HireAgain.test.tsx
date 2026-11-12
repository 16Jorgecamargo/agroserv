import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('hire again', () => {
  it('opens the request form with the same service and property', async () => {
    const record = getMockDatabase().requestRecords.find((candidate) => candidate.request.id === 'req-5')!
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-5')

    await userEvent.click(await screen.findByRole('button', { name: 'Contratar de novo' }))

    const dialog = await screen.findByRole('dialog', { name: 'Contratar de novo' })
    await waitFor(() => expect(within(dialog).getByLabelText('Propriedade')).toHaveValue(record.request.propertyId))
  })

  it('offers similar services when the service is no longer available', async () => {
    getMockDatabase().services.find((service) => service.id === 'svc-6')!.available = false
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-5')

    await userEvent.click(await screen.findByRole('button', { name: 'Contratar de novo' }))

    const dialog = await screen.findByRole('dialog', { name: 'Serviço indisponível' })
    expect(within(dialog).getByRole('link', { name: 'Ver serviços parecidos' })).toHaveAttribute('href', '/servicos?category=transporte')
  })
})
