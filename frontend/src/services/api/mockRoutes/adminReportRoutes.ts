import type { Paginated, QueryValue, ReportDetail } from '../../../types/api'
import type { Report, ReportResolutionAction, ReportStatus, ReportTargetType, User } from '../../../types/entities'
import { reportActionsNeedingMessage, reportAllowedActions, reportTargetTypes } from '../../../utils/reportLabels'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { suspendUser } from './adminRoutes'
import { hideService } from './adminServiceRoutes'
import { recordAdminAction, requireAdmin } from './adminShared'
import { getRequestDetail, getRequestRecord } from './requestTransitions'
import { adjustReviewAverages, removeRating } from './reviewRoutes'
import {
  getBody,
  invalidTransition,
  notFound,
  notificationsLinkFor,
  notify,
  paginate,
  serviceNotFound,
  textField,
  throwIfFields,
  toPositiveInt,
  toService,
  validationError,
} from './shared'
import type { MockRoute } from './types'

const REPORT_STATUSES: ReportStatus[] = ['open', 'resolved', 'dismissed']
const ACTIONS: ReportResolutionAction[] = ['hide_service', 'hide_review', 'warn', 'suspend', 'archive']
const ACTION_MESSAGE = 'Ação não permitida para esta denúncia.'
const USER_MESSAGE = 'Escreva a mensagem para o usuário.'
const TARGET_USER_MESSAGE = 'Escolha o produtor ou o prestador da solicitação.'

function loadReport(reportId: string): Report {
  return getMockDatabase().reports.find((report) => report.id === reportId) ?? notFound('report_not_found', 'Denúncia não encontrada.')
}

function findAnyUser(userId: string): User {
  return getMockDatabase().users.find((user) => user.id === userId) ?? notFound('user_not_found', 'Usuário não encontrado.')
}

function findReview(reviewId: string) {
  return getMockDatabase().reviews.find((review) => review.id === reviewId) ?? notFound('review_not_found', 'Avaliação não encontrada.')
}

function listReports(query: Record<string, QueryValue>): Paginated<Report> {
  const status = query.status === 'all' ? undefined : (REPORT_STATUSES.find((candidate) => candidate === query.status) ?? 'open')
  const targetType = reportTargetTypes.find((candidate) => candidate === query.targetType)
  const reports = getMockDatabase()
    .reports.filter((report) => !status || report.status === status)
    .filter((report) => !targetType || report.targetType === targetType)
    .sort((a, b) => (status === 'open' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)))

  return paginate(reports, toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER), toPositiveInt(query.pageSize, 20, 100))
}

function currentTarget(report: Report): ReportDetail['target'] {
  const database = getMockDatabase()
  if (report.targetType === 'service') {
    const record = database.services.find((service) => service.id === report.targetId) ?? serviceNotFound()
    return toService(record, true)
  }
  if (report.targetType === 'review') return findReview(report.targetId)
  if (report.targetType === 'request') return getRequestDetail(getRequestRecord(report.targetId), 'admin')
  return findAnyUser(report.targetId)
}

function buildDetail(report: Report): ReportDetail {
  const target = currentTarget(report)
  if (report.targetType !== 'request') return { report, target }
  const messages = getMockDatabase()
    .messages.filter((message) => message.requestId === report.targetId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { report, target, messages }
}

function affectedUserId(report: Report, targetUserId: string | undefined): string {
  const database = getMockDatabase()
  if (report.targetType === 'user') return report.targetId
  if (report.targetType === 'service') {
    const record = database.services.find((service) => service.id === report.targetId) ?? serviceNotFound()
    return record.providerId
  }
  if (report.targetType === 'review') return findReview(report.targetId).producerId
  const request = getRequestRecord(report.targetId).request
  if (!targetUserId || ![request.producerId, request.providerId].includes(targetUserId)) validationError({ targetUserId: TARGET_USER_MESSAGE })
  return targetUserId
}

function applyAction(admin: User, report: Report, action: ReportResolutionAction, message: string, targetUserId?: string): string | undefined {
  const database = getMockDatabase()
  if (action === 'archive') return undefined

  if (action === 'hide_service') {
    const record = database.services.find((service) => service.id === report.targetId && !service.deletedAt) ?? serviceNotFound()
    hideService(admin, record, message)
    return undefined
  }

  if (action === 'hide_review') {
    const review = findReview(report.targetId)
    if (!review.hidden) {
      review.hidden = true
      adjustReviewAverages(review, (totals) => removeRating(totals, review.rating))
    }
    recordAdminAction(admin, 'hide_review', 'review', review.id, report.targetLabel)
    return undefined
  }

  const user = findAnyUser(affectedUserId(report, targetUserId))
  if (action === 'suspend') {
    suspendUser(admin, user.id, message)
    return user.id
  }

  notify(user.id, 'warning', 'Aviso da administração', notificationsLinkFor(user.role), message)
  recordAdminAction(admin, 'warn_user', 'user', user.id, user.name, message)
  return user.id
}

function resolveReport(admin: User, reportId: string, body: unknown): Report {
  const payload = getBody(body)
  const action = ACTIONS.find((candidate) => candidate === payload.action)
  const message = textField(payload.message)
  const internalNote = textField(payload.internalNote)
  const targetUserId = textField(payload.targetUserId) || undefined
  const fields: Record<string, string> = {}
  if (!action) fields.action = ACTION_MESSAGE
  if (message && (message.length < 5 || message.length > 500)) fields.message = USER_MESSAGE
  if (internalNote.length < 5 || internalNote.length > 1000) fields.internalNote = 'Escreva a nota interna com pelo menos 5 caracteres.'
  throwIfFields(fields)

  const report = loadReport(reportId)
  const chosen = action as ReportResolutionAction
  if (report.status !== 'open') invalidTransition('Esta denúncia já foi analisada.')
  if (!reportAllowedActions[report.targetType as ReportTargetType].includes(chosen)) validationError({ action: ACTION_MESSAGE })
  if (reportActionsNeedingMessage.includes(chosen) && !message) validationError({ message: USER_MESSAGE })

  const affected = applyAction(admin, report, chosen, message, targetUserId)
  report.status = chosen === 'archive' ? 'dismissed' : 'resolved'
  report.resolution = {
    action: chosen,
    ...(affected ? { targetUserId: affected } : {}),
    ...(message ? { message } : {}),
    internalNote,
    adminId: admin.id,
    adminName: admin.name,
    resolvedAt: new Date().toISOString(),
  }

  notify(report.reporterId, 'report_resolved', 'Sua denúncia foi analisada.', notificationsLinkFor(report.reporterRole))
  recordAdminAction(admin, chosen === 'archive' ? 'dismiss_report' : 'resolve_report', 'report', report.id, report.targetLabel, internalNote)
  persistMockDatabase()
  return report
}

export const adminReportRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/admin/reports',
    handle: ({ token, query }) => {
      requireAdmin(token)
      return listReports(query)
    },
  },
  {
    method: 'GET',
    pattern: '/admin/reports/:id',
    handle: ({ token, params }) => {
      requireAdmin(token)
      return buildDetail(loadReport(params.id))
    },
  },
  {
    method: 'POST',
    pattern: '/admin/reports/:id/resolve',
    handle: ({ token, params, body }) => resolveReport(requireAdmin(token), params.id, body),
  },
]
