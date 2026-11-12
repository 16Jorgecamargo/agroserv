import { brazilianStateCodes } from '../../../data/states'
import type { AdminDashboard, AdminUserDetail, Paginated, QueryValue } from '../../../types/api'
import type { RequestStatus, Role, User } from '../../../types/entities'
import { requestStatuses } from '../../../utils/requestStatus'
import { isValidEmail } from '../../../utils/validators'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { recordAdminAction, requireAdmin, requireReason } from './adminShared'
import { cancelOpenRequestsForUser, getRequestDetail, getRequestRecord } from './requestTransitions'
import {
  conflict,
  getBody,
  isServiceVisible,
  matchesAllTerms,
  nextId,
  notFound,
  paginate,
  textField,
  throwIfFields,
  toOptionalString,
  toPositiveInt,
  toService,
} from './shared'
import type { MockRoute } from './types'

const ROLES: Role[] = ['producer', 'provider', 'admin']
const PASSWORD_MESSAGE = 'A senha precisa ter pelo menos 8 caracteres.'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function buildDashboard(now: Date): AdminDashboard {
  const database = getMockDatabase()
  const accounts = database.users.filter((user) => user.status !== 'deleted')
  const since = now.getTime() - WEEK_MS
  const requestsByStatus = Object.fromEntries(requestStatuses.map((status) => [status, 0])) as Record<RequestStatus, number>
  const requestsByCategory = new Map<string, number>()

  database.requestRecords.forEach(({ request }) => {
    requestsByStatus[request.status] += 1
    const categoryId = database.services.find((service) => service.id === request.serviceId)?.categoryId
    if (categoryId) requestsByCategory.set(categoryId, (requestsByCategory.get(categoryId) ?? 0) + 1)
  })

  const topCategories = [...requestsByCategory.entries()]
    .map(([categoryId, requests]) => ({
      categoryId,
      name: database.categories.find((category) => category.id === categoryId)?.name ?? '',
      requests,
    }))
    .sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, 5)

  return {
    users: {
      producers: accounts.filter((user) => user.role === 'producer').length,
      providers: accounts.filter((user) => user.role === 'provider').length,
      admins: accounts.filter((user) => user.role === 'admin').length,
    },
    newUsersLast7Days: accounts.filter((user) => new Date(user.createdAt).getTime() >= since).length,
    requestsByStatus,
    activeServices: database.services.filter(isServiceVisible).length,
    topCategories,
    pendingVerifications: database.providerProfiles.filter((profile) => profile.verificationStatus === 'under_review').length,
    openReports: database.reports.filter((report) => report.status === 'open').length,
  }
}

function userNotFound(): never {
  return notFound('user_not_found', 'Usuário não encontrado.')
}

function findAnyUser(userId: string): User {
  return getMockDatabase().users.find((user) => user.id === userId) ?? userNotFound()
}

function findAccount(userId: string): User {
  const user = findAnyUser(userId)
  return user.status === 'deleted' ? userNotFound() : user
}

function listUsers(query: Record<string, QueryValue>): Paginated<User> {
  const q = toOptionalString(query.q)
  const role = ROLES.find((candidate) => candidate === query.role)
  const status = query.status === 'active' || query.status === 'suspended' ? query.status : undefined
  const users = getMockDatabase()
    .users.filter((user) => user.status !== 'deleted')
    .filter((user) => !role || user.role === role)
    .filter((user) => !status || user.status === status)
    .filter((user) => !q || matchesAllTerms(`${user.name} ${user.email}`, q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return paginate(users, toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER), toPositiveInt(query.pageSize, 20, 100))
}

function createAdmin(admin: User, body: unknown): User {
  const payload = getBody(body)
  const database = getMockDatabase()
  const name = textField(payload.name)
  const email = textField(payload.email).toLowerCase()
  const password = typeof payload.password === 'string' ? payload.password : ''
  const city = textField(payload.city)
  const state = typeof payload.state === 'string' ? payload.state : ''
  const fields: Record<string, string> = {}

  if (name.length < 2 || name.length > 120) fields.name = 'Informe seu nome.'
  if (!isValidEmail(email)) fields.email = 'Informe um e-mail válido.'
  else if (database.users.some((user) => user.status !== 'deleted' && user.email.toLowerCase() === email)) {
    fields.email = 'Este e-mail já está cadastrado.'
  }
  if (password.length < 8) fields.password = PASSWORD_MESSAGE
  if (city.length < 2 || city.length > 80) fields.city = 'Informe sua cidade.'
  if (!brazilianStateCodes.has(state)) fields.state = 'Selecione a UF.'
  throwIfFields(fields)

  const user: User = {
    id: nextId('adm', database.users.map((candidate) => candidate.id)),
    name,
    email,
    role: 'admin',
    city,
    state,
    status: 'active',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  }
  database.users.push(user)
  database.userCredentials.push({ userId: user.id, password })
  recordAdminAction(admin, 'create_admin', 'user', user.id, user.name)
  persistMockDatabase()
  return user
}

function buildUserDetail(userId: string): AdminUserDetail {
  const database = getMockDatabase()
  const user = findAccount(userId)
  const isProvider = user.role === 'provider'
  const providerProfile = isProvider ? database.providerProfiles.find((profile) => profile.userId === userId) : undefined
  const requests = database.requestRecords
    .map((record) => record.request)
    .filter((request) => request.producerId === userId || request.providerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)
  const reviews = database.reviews
    .filter((review) => (isProvider ? review.providerId === userId : review.producerId === userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const actions = database.adminActions
    .filter((action) => action.targetId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    user,
    ...(providerProfile ? { providerProfile } : {}),
    requests,
    ...(isProvider
      ? {
          services: database.services
            .filter((service) => service.providerId === userId && !service.deletedAt)
            .map((service) => toService(service, true)),
        }
      : {}),
    reviews,
    actions,
  }
}

export function suspendUser(admin: User, userId: string, reason: string): User {
  const database = getMockDatabase()
  const user = findAccount(userId)
  if (user.id === admin.id) conflict('Você não pode suspender a sua própria conta.')
  const activeAdmins = database.users.filter((candidate) => candidate.role === 'admin' && candidate.status === 'active').length
  if (user.role === 'admin' && user.status === 'active' && activeAdmins <= 1) {
    conflict('É preciso manter pelo menos um administrador ativo.')
  }
  if (user.status === 'suspended') conflict('Esta conta já está suspensa.')

  user.status = 'suspended'
  cancelOpenRequestsForUser(user.id)
  recordAdminAction(admin, 'suspend_user', 'user', user.id, user.name, reason)
  persistMockDatabase()
  return user
}

function reactivateUser(admin: User, userId: string): User {
  const user = findAnyUser(userId)
  if (user.status === 'deleted') conflict('Contas excluídas não podem ser reativadas.')
  if (user.status === 'active') conflict('Esta conta já está ativa.')

  user.status = 'active'
  recordAdminAction(admin, 'reactivate_user', 'user', user.id, user.name)
  persistMockDatabase()
  return user
}

export const adminRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/dashboard',
    handle: ({ token }) => {
      requireAdmin(token)
      return buildDashboard(new Date())
    },
  },
  {
    method: 'GET',
    pattern: '/admin/users',
    handle: ({ token, query }) => {
      requireAdmin(token)
      return listUsers(query)
    },
  },
  {
    method: 'POST',
    pattern: '/admin/users',
    handle: ({ token, body }) => createAdmin(requireAdmin(token), body),
  },
  {
    method: 'GET',
    pattern: '/admin/users/:id',
    handle: ({ token, params }) => {
      requireAdmin(token)
      return buildUserDetail(params.id)
    },
  },
  {
    method: 'POST',
    pattern: '/admin/users/:id/suspend',
    handle: ({ token, params, body }) => {
      const admin = requireAdmin(token)
      return suspendUser(admin, params.id, requireReason(body))
    },
  },
  {
    method: 'POST',
    pattern: '/admin/users/:id/reactivate',
    handle: ({ token, params }) => reactivateUser(requireAdmin(token), params.id),
  },
  {
    method: 'GET',
    pattern: '/admin/requests/:id',
    handle: ({ token, params }) => {
      requireAdmin(token)
      return getRequestDetail(getRequestRecord(params.id), 'admin')
    },
  },
]
