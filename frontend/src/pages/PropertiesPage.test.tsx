import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('PropertiesPage', () => {
  it('lists the producer properties with area and crops', async () => {
    signInAsDemoProducer()
    renderApp('/propriedades')

    const list = await screen.findByRole('list', { name: 'Lista de propriedades' })
    expect(within(list).getByRole('heading', { name: 'Fazenda Boa Vista' })).toBeInTheDocument()
    expect(within(list).getByText('240 ha')).toBeInTheDocument()
    expect(within(list).getAllByText('Soja')).toHaveLength(2)
  })

  it('creates a property with crops typed as tags', async () => {
    signInAsDemoProducer()
    renderApp('/propriedades')

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar propriedade' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome da propriedade'), 'Chácara Primavera')
    await userEvent.type(within(dialog).getByLabelText('Área (hectares)'), '32.5')
    await userEvent.type(within(dialog).getByLabelText('Culturas'), 'Café{Enter}Feijão{Enter}')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar propriedade' }))

    expect(await screen.findByRole('heading', { name: 'Chácara Primavera' })).toBeInTheDocument()
    expect(screen.getByText('32,5 ha')).toBeInTheDocument()
    expect(screen.getByText('Feijão')).toBeInTheDocument()
  })

  it('shows validation messages before sending', async () => {
    signInAsDemoProducer()
    renderApp('/propriedades')

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastrar propriedade' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar propriedade' }))

    expect(screen.getByText('Informe o nome da propriedade.')).toBeInTheDocument()
    expect(screen.getByText('Informe a área em hectares.')).toBeInTheDocument()
  })

  it('explains why a property with open requests cannot be removed', async () => {
    signInAsDemoProducer()
    renderApp('/propriedades')

    await userEvent.click(await screen.findByRole('button', { name: 'Remover Fazenda Boa Vista' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta propriedade tem solicitações em aberto.')
  })

  it('shows the empty state with the create button', async () => {
    getMockDatabase().properties = []
    signInAsDemoProducer()
    renderApp('/propriedades')

    expect(await screen.findByText('Nenhuma propriedade cadastrada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar propriedade' })).toBeInTheDocument()
  })
})
