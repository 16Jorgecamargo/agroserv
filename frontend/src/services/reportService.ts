import type { Report, ReportReason, ReportTargetType } from '../types/entities'
import { apiClient } from './api/apiClient'

export interface CreateReportPayload {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string
}

export const reportService = {
  create(payload: CreateReportPayload): Promise<Report> {
    return apiClient.post<Report>('/reports', payload)
  },
}
