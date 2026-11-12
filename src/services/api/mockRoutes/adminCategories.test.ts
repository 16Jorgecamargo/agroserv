import { describe, expect, it } from 'vitest'
import type { AdminCategory } from '../../../types/api'
import type { Category } from '../../../types/entities'
import { call, captureError, tokens } from '../../../test/mockApi'
import { getMockDatabase } from '../mockDatabase'

describe('admin categories', () => {
  it('lists every category with its service count', () => {
    getMockDatabase().categories.find((category) => category.id === 'cat-transport')!.active = false
    const categories = call<AdminCategory[]>('GET', '/admin/categories', { token: tokens.admin })

    expect(categories.find((category) => category.id === 'cat-transport')?.active).toBe(false)
    const harvest = categories.find((category) => category.id === 'cat-harvest')!
    expect(harvest.serviceCount).toBe(getMockDatabase().services.filter((service) => service.categoryId === 'cat-harvest' && !service.deletedAt).length)
  })

  it('creates a category with a generated slug', () => {
    const created = call<Category>('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Calagem e Correção', icon: 'shovel' } })

    expect(created).toMatchObject({ slug: 'calagem-e-correcao', active: true, icon: 'shovel' })
    expect(call<Category[]>('GET', '/categories').map((category) => category.id)).toContain(created.id)
    expect(getMockDatabase().adminActions.at(-1)).toMatchObject({ action: 'create_category', targetId: created.id })
  })

  it('validates name, slug and icon', () => {
    expect(captureError(() => call('POST', '/admin/categories', { token: tokens.admin, body: { name: 'X', icon: 'rocket' } })).fields).toEqual({
      name: 'Informe o nome.',
      icon: 'Selecione um ícone.',
    })
    expect(captureError(() => call('POST', '/admin/categories', { token: tokens.admin, body: { name: 'colheita', icon: 'wheat' } })).fields).toEqual({
      name: 'Já existe uma categoria com este nome.',
    })
    expect(captureError(() => call('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Nova', slug: 'colheita', icon: 'wheat' } })).fields).toEqual({
      slug: 'Já existe uma categoria com este endereço.',
    })
    expect(captureError(() => call('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Nova', slug: 'Com Espaço', icon: 'wheat' } })).fields).toEqual({
      slug: 'Use apenas letras minúsculas, números e hífen.',
    })
  })

  it('deactivates without hiding existing services', () => {
    const updated = call<Category>('PATCH', '/admin/categories/cat-transport', { token: tokens.admin, body: { active: false } })

    expect(updated.active).toBe(false)
    expect(call<Category[]>('GET', '/categories').map((category) => category.id)).not.toContain('cat-transport')
    const transportService = getMockDatabase().services.find((service) => service.categoryId === 'cat-transport' && service.status === 'active')!
    expect(call<{ id: string }>('GET', `/services/${transportService.id}`).id).toBe(transportService.id)
    expect(
      captureError(() =>
        call('POST', '/provider/services', {
          token: tokens.provider,
          body: { title: 'Frete de Calcário', categoryId: 'cat-transport', description: 'Transporte de calcário a granel na região.', price: 500, priceUnit: 'trip', city: 'Santa Helena', state: 'PR', photos: [] },
        }),
      ).fields?.categoryId,
    ).toBe('Selecione uma categoria.')
  })

  it('deletes only categories without services', () => {
    expect(captureError(() => call('DELETE', '/admin/categories/cat-harvest', { token: tokens.admin })).message).toBe(
      'Esta categoria tem serviços. Desative em vez de apagar.',
    )
    const created = call<Category>('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Apicultura', icon: 'sun' } })
    call('DELETE', `/admin/categories/${created.id}`, { token: tokens.admin })

    expect(getMockDatabase().categories.some((category) => category.id === created.id)).toBe(false)
    expect(getMockDatabase().adminActions.at(-1)).toMatchObject({ action: 'delete_category' })
  })
})
