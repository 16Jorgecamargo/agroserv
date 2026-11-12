import type { BadgeTone } from '../components/ui/Badge'
import type { ReportReason, ReportResolutionAction, ReportStatus, ReportTargetType } from '../types/entities'

export const reportReasonLabels: Record<ReportReason, string> = {
  offensive: 'Conteúdo ofensivo',
  false_info: 'Informação falsa',
  fraud: 'Golpe ou fraude',
  service_not_done: 'Serviço não realizado',
  other: 'Outro',
}

export const reportReasons = Object.keys(reportReasonLabels) as ReportReason[]

export const reportTargetLabels: Record<ReportTargetType, string> = {
  service: 'Anúncio',
  review: 'Avaliação',
  user: 'Usuário',
  request: 'Solicitação',
}

export const reportTargetTypes = Object.keys(reportTargetLabels) as ReportTargetType[]

export const reportStatusLabels: Record<ReportStatus, string> = {
  open: 'Aberta',
  resolved: 'Resolvida',
  dismissed: 'Arquivada',
}

export const reportStatusTones: Record<ReportStatus, BadgeTone> = {
  open: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
}

export const reportActionLabels: Record<ReportResolutionAction, string> = {
  hide_service: 'Ocultar anúncio',
  hide_review: 'Ocultar avaliação',
  warn: 'Advertir usuário',
  suspend: 'Suspender usuário',
  archive: 'Arquivar sem ação',
}

export const reportAllowedActions: Record<ReportTargetType, ReportResolutionAction[]> = {
  service: ['hide_service', 'warn', 'suspend', 'archive'],
  review: ['hide_review', 'warn', 'suspend', 'archive'],
  user: ['warn', 'suspend', 'archive'],
  request: ['warn', 'suspend', 'archive'],
}

export const reportActionsNeedingMessage: ReportResolutionAction[] = ['hide_service', 'warn', 'suspend']
