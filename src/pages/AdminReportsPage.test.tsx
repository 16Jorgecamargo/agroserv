import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin, signInAsDemoProducer, signInAsDemoProvider } from '../test/session'

describe('reporting', () => {
  it('lets the producer report a service from its page', async () => {
    signInAsDemoProducer()
    renderApp('/servicos/svc-1')

    await userEvent.click(await screen.findByRole('button', { name: 'Denunciar anúncio' }))
    const dialog = screen.getByRole('dialog', { name: 'Denunciar anúncio' })
    await userEvent.selectOptions(within(dialog).getByLabelText('Motivo'), 'false_info')
    await userEvent.type(within(dialog).getByLabelText('Descrição'), 'As fotos são de outro equipamento.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(getMockDatabase().reports.at(-1)).toMatchObject({ targetType: 'service', targetId: 'svc-1', reason: 'false_info' })
  })

  it('lets the producer report the provider of a request and blocks repeats', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes/req-10')

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await userEvent.click(await screen.findByRole('button', { name: 'Denunciar' }))
      const dialog = screen.getByRole('dialog', { name: 'Denunciar' })
      await userEvent.click(within(dialog).getByLabelText('O prestador Agro Máquinas Paraná'))
      await userEvent.selectOptions(within(dialog).getByLabelText('Motivo'), 'offensive')
      await userEvent.type(within(dialog).getByLabelText('Descrição'), 'Mensagens ofensivas na conversa.')
      await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar denúncia' }))
    }

    expect(await screen.findByText('Você já denunciou este item. Aguarde a análise.')).toBeInTheDocument()
    expect(getMockDatabase().reports.filter((report) => report.targetType === 'user' && report.targetId === 'prv-1')).toHaveLength(1)
  })

  it('lets the provider report a received review', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/avaliacoes')

    await userEvent.click((await screen.findAllByRole('button', { name: 'Denunciar avaliação' }))[0])
    const dialog = screen.getByRole('dialog')
    await userEvent.selectOptions(within(dialog).getByLabelText('Motivo'), 'offensive')
    await userEvent.type(within(dialog).getByLabelText('Descrição'), 'Comentário com palavrões.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(getMockDatabase().reports.at(-1)?.targetType).toBe('review'))
  })
})

describe('AdminReportsPage', () => {
  it('opens a report and hides the service with an internal note', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/denuncias')

    const list = await screen.findByRole('list', { name: 'Lista de denúncias' })
    await userEvent.click(within(list).getByRole('link', { name: 'Manutenção de Sistemas de Irrigação' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Manutenção de Sistemas de Irrigação' })).toBeInTheDocument()
    expect(screen.getByText(/não atende Santa Helena/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Ocultar avaliação')).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Ocultar anúncio'))
    await userEvent.type(screen.getByLabelText('Motivo enviado ao prestador'), 'Área de atendimento falsa.')
    await userEvent.type(screen.getByLabelText('Nota interna'), 'Conferido no mapa.')
    await userEvent.click(screen.getByRole('button', { name: 'Concluir análise' }))

    expect(await screen.findByRole('heading', { name: 'Resultado' })).toBeInTheDocument()
    expect(screen.getByText('Conferido no mapa.')).toBeInTheDocument()
    expect(getMockDatabase().services.find((service) => service.id === 'svc-12')?.status).toBe('hidden')
  })

  it('filters resolved reports', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/denuncias')

    await screen.findByRole('list', { name: 'Lista de denúncias' })
    await userEvent.click(screen.getByRole('button', { name: 'Resolvidas' }))

    expect(await screen.findByText('Nenhuma denúncia')).toBeInTheDocument()
  })
})
