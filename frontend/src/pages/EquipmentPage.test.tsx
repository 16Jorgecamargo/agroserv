import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProvider } from '../test/session'

describe('EquipmentPage', () => {
  it('creates equipment and removes another', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/equipamentos')

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar equipamento' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.selectOptions(within(dialog).getByLabelText('Tipo'), 'drone')
    await userEvent.type(within(dialog).getByLabelText('Ano'), '2024')
    await userEvent.type(within(dialog).getByLabelText('Marca e modelo'), 'DJI Agras T40')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar equipamento' }))

    expect(await screen.findByRole('heading', { name: 'DJI Agras T40' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Remover Jacto Uniport 3030' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText('Equipamento removido dos seus serviços.')).toBeInTheDocument()
    expect(getMockDatabase().equipment.some((item) => item.id === 'eqp-1')).toBe(false)
  })

  it('links equipment from the service form and shows it on the public detail', async () => {
    signInAsDemoProvider()
    renderApp('/prestador/servicos/svc-5/editar')

    await userEvent.click(await screen.findByLabelText('Pulverizador · Jacto Uniport 3030'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Anúncio atualizado.')).toBeInTheDocument()
    expect(getMockDatabase().services.find((service) => service.id === 'svc-5')?.equipmentIds).toEqual(['eqp-2', 'eqp-1'])
  })

  it('shows equipment on the service detail', async () => {
    renderApp('/servicos/svc-1')

    const section = await screen.findByRole('region', { name: 'Equipamentos' })
    expect(within(section).getByText('Jacto Uniport 3030')).toBeInTheDocument()
  })
})
