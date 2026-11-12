import type { DemoRestoreResponse } from '../../../types/api'
import { resetMockDatabase } from '../mockDatabase'
import type { MockRoute } from './types'

function restoreDemoData(): DemoRestoreResponse {
  resetMockDatabase()
  return { message: 'Dados demo restaurados.' }
}

export const demoRoutes: MockRoute[] = [{ method: 'POST', pattern: '/mock/restore-demo', handle: restoreDemoData }]
