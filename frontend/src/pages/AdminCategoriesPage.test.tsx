import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../services/api/mockDatabase'
import { renderApp } from '../test/renderApp'
import { signInAsDemoAdmin } from '../test/session'

describe('AdminCategoriesPage', () => {
  it('creates a category with an automatic slug', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/categorias')

    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialog = screen.getByRole('dialog', { name: 'Nova categoria' })
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Silagem')
    expect(within(dialog).getByLabelText('Endereço')).toHaveValue('silagem')
    await userEvent.click(within(dialog).getByLabelText('Armazém'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }))

    const list = await screen.findByRole('list', { name: 'Lista de categorias' })
    expect(await within(list).findByText('Silagem')).toBeInTheDocument()
    expect(getMockDatabase().categories.find((category) => category.slug === 'silagem')?.icon).toBe('warehouse')
  })

  it('deactivates a category', async () => {
    signInAsDemoAdmin()
    renderApp('/admin/categorias')

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar Transporte' }))

    expect(await screen.findByRole('button', { name: 'Ativar Transporte' })).toBeInTheDocument()
    expect(getMockDatabase().categories.find((category) => category.id === 'cat-transport')?.active).toBe(false)
  })
})
