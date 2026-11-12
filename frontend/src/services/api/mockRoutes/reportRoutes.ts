import type { Report, ReportReason, ReportTargetType, User } from '../../../types/entities'
import { reportReasonLabels, reportReasons, reportTargetTypes } from '../../../utils/reportLabels'
import { ApiError } from '../apiError'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import {
  conflict,
  findServiceRecord,
  findUserByToken,
  getBody,
  isServiceVisible,
  nextId,
  notFound,
  notifyAdmins,
  textField,
  throwIfFields,
  validationError,
} from './shared'
import type { MockRoute, RouteContext } from './types'

export const NOT_ALLOWED_MESSAGE = 'Você não pode denunciar este item.'

const ALLOWED_TARGETS: Record<'producer' | 'provider', ReportTargetType[]> = {
  producer: ['service', 'user', 'request'],
  provider: ['review', 'user', 'request'],
}

function notAllowed(): never {
  return validationError({ targetType: NOT_ALLOWED_MESSAGE })
}

function hasRelationship(producerId: string, providerId: string): boolean {
  return getMockDatabase().requestRecords.some(({ request }) => request.producerId === producerId && request.providerId === providerId)
}

function resolveLabel(reporter: User, targetType: ReportTargetType, targetId: string): string {
  const database = getMockDatabase()

  if (targetType === 'service') {
    const service = findServiceRecord(targetId)
    if (!service || !isServiceVisible(service)) notFound('service_not_found', 'Serviço não encontrado.')
    return service.title
  }

  if (targetType === 'review') {
    const review = database.reviews.find((candidate) => candidate.id === targetId)
    if (!review) notFound('review_not_found', 'Avaliação não encontrada.')
    if (review.providerId !== reporter.id) notAllowed()
    return `Avaliação de ${review.producerName} · ${review.serviceTitle}`
  }

  if (targetType === 'request') {
    const record = database.requestRecords.find((candidate) => candidate.request.id === targetId)
    const request = record?.request
    const isParty = request && (reporter.role === 'producer' ? request.producerId === reporter.id : request.providerId === reporter.id)
    if (!request || !isParty) notFound('request_not_found', 'Solicitação não encontrada.')
    return `Solicitação ${request.id} · ${request.serviceTitle}`
  }

  const target = database.users.find((candidate) => candidate.id === targetId)
  if (!target) notFound('user_not_found', 'Usuário não encontrado.')
  const opposite = target.role !== reporter.role && target.role !== 'admin'
  const producerId = reporter.role === 'producer' ? reporter.id : target.id
  const providerId = reporter.role === 'producer' ? target.id : reporter.id
  if (!opposite || !hasRelationship(producerId, providerId)) notAllowed()
  return target.name
}

function createReport({ token, body }: RouteContext): Report {
  const reporter = findUserByToken(token)
  if (reporter.role === 'admin') throw new ApiError({ status: 403, code: 'forbidden', message: 'Você não tem permissão para esta ação.' })
  const payload = getBody(body)
  const targetType = reportTargetTypes.find((candidate) => candidate === payload.targetType)
  const targetId = textField(payload.targetId)
  const reason = reportReasons.find((candidate) => candidate === payload.reason)
  const description = textField(payload.description)
  const fields: Record<string, string> = {}
  if (!targetType || !targetId) fields.targetType = NOT_ALLOWED_MESSAGE
  if (!reason) fields.reason = 'Selecione o motivo.'
  if (description.length < 10 || description.length > 1000) fields.description = 'Descreva o problema com pelo menos 10 caracteres.'
  throwIfFields(fields)

  const type = targetType as ReportTargetType
  const role = reporter.role as 'producer' | 'provider'
  if (!ALLOWED_TARGETS[role].includes(type)) notAllowed()
  const targetLabel = resolveLabel(reporter, type, targetId)

  const database = getMockDatabase()
  const duplicate = database.reports.some(
    (report) => report.status === 'open' && report.reporterId === reporter.id && report.targetType === type && report.targetId === targetId,
  )
  if (duplicate) conflict('Você já denunciou este item. Aguarde a análise.')

  const report: Report = {
    id: nextId('rep', database.reports.map((candidate) => candidate.id)),
    reporterId: reporter.id,
    reporterName: reporter.name,
    reporterRole: reporter.role,
    targetType: type,
    targetId,
    targetLabel,
    reason: reason as ReportReason,
    description,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  database.reports.push(report)
  notifyAdmins('report_created', `Nova denúncia: ${reportReasonLabels[report.reason]}`, '/admin/denuncias')
  persistMockDatabase()
  return report
}

export const reportRoutes: MockRoute[] = [{ method: 'POST', pattern: '/reports', handle: createReport }]

