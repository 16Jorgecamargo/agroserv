import type { AdminCategory } from '../../../types/api'
import type { Category, CategoryIcon, User } from '../../../types/entities'
import { categoryIcons, SLUG_PATTERN } from '../../../utils/categoryIcons'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { recordAdminAction, requireAdmin } from './adminShared'
import { conflict, getBody, normalizeText, notFound, textField, throwIfFields } from './shared'
import type { MockRoute } from './types'

const SLUG_MESSAGE = 'Use apenas letras minúsculas, números e hífen.'

function loadCategory(categoryId: string): Category {
  return getMockDatabase().categories.find((category) => category.id === categoryId) ?? notFound('category_not_found', 'Categoria não encontrada.')
}

function slugify(value: string): string {
  return normalizeText(value).replace(/ /g, '-')
}

function listCategories(): AdminCategory[] {
  const database = getMockDatabase()
  return database.categories.map((category) => ({
    ...category,
    serviceCount: database.services.filter((service) => service.categoryId === category.id && !service.deletedAt).length,
  }))
}

interface CategoryInput {
  name?: string
  slug?: string
  icon?: CategoryIcon
  active?: boolean
}

function parseInput(body: unknown, partial: boolean, ignoreId?: string): CategoryInput {
  const payload = getBody(body)
  const fields: Record<string, string> = {}
  const input: CategoryInput = {}

  if (!partial || payload.name !== undefined) {
    const name = textField(payload.name)
    if (name.length < 2 || name.length > 40) fields.name = 'Informe o nome.'
    else input.name = name
  }
  if (payload.slug !== undefined || !partial) {
    const slug = payload.slug === undefined ? undefined : textField(payload.slug)
    if (slug !== undefined && !SLUG_PATTERN.test(slug)) fields.slug = SLUG_MESSAGE
    else if (slug !== undefined) input.slug = slug
  }
  if (!partial || payload.icon !== undefined) {
    const icon = categoryIcons.find((candidate) => candidate === payload.icon)
    if (!icon) fields.icon = 'Selecione um ícone.'
    else input.icon = icon
  }
  if (payload.active !== undefined) {
    if (typeof payload.active !== 'boolean') fields.active = 'Informe se a categoria está ativa.'
    else input.active = payload.active
  }
  throwIfFields(fields)

  const others = getMockDatabase().categories.filter((category) => category.id !== ignoreId)
  if (input.name && others.some((category) => normalizeText(category.name) === normalizeText(input.name as string))) {
    throwIfFields({ name: 'Já existe uma categoria com este nome.' })
  }
  const slugToCheck = input.slug ?? (!partial && input.name ? slugify(input.name) : undefined)
  if (slugToCheck !== undefined && (!slugToCheck || others.some((category) => category.slug === slugToCheck))) {
    throwIfFields({ slug: 'Já existe uma categoria com este endereço.' })
  }
  if (!partial && !input.slug && input.name) input.slug = slugify(input.name)
  return input
}

function createCategory(admin: User, body: unknown): Category {
  const input = parseInput(body, false)
  const database = getMockDatabase()
  const slug = input.slug as string
  let id = `cat-${slug}`
  for (let index = 2; database.categories.some((category) => category.id === id); index += 1) id = `cat-${slug}-${index}`
  const category: Category = { id, slug, name: input.name as string, icon: input.icon as CategoryIcon, active: true }
  database.categories.push(category)
  recordAdminAction(admin, 'create_category', 'category', category.id, category.name)
  persistMockDatabase()
  return category
}

function updateCategory(admin: User, categoryId: string, body: unknown): Category {
  const category = loadCategory(categoryId)
  const input = parseInput(body, true, categoryId)
  Object.assign(category, input)
  recordAdminAction(admin, 'update_category', 'category', category.id, category.name)
  persistMockDatabase()
  return category
}

function deleteCategory(admin: User, categoryId: string): undefined {
  const database = getMockDatabase()
  const category = loadCategory(categoryId)
  if (database.services.some((service) => service.categoryId === categoryId)) conflict('Esta categoria tem serviços. Desative em vez de apagar.')
  database.categories = database.categories.filter((candidate) => candidate.id !== categoryId)
  recordAdminAction(admin, 'delete_category', 'category', category.id, category.name)
  persistMockDatabase()
  return undefined
}

export const adminCategoryRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/categories',
    handle: ({ token }) => {
      requireAdmin(token)
      return listCategories()
    },
  },
  { method: 'POST', pattern: '/admin/categories', handle: ({ token, body }) => createCategory(requireAdmin(token), body) },
  { method: 'PATCH', pattern: '/admin/categories/:id', handle: ({ token, params, body }) => updateCategory(requireAdmin(token), params.id, body) },
  { method: 'DELETE', pattern: '/admin/categories/:id', handle: ({ token, params }) => deleteCategory(requireAdmin(token), params.id) },
]
