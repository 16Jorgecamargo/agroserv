import { getMockDatabase } from '../services/api/mockDatabase'

const FIXED_REQUEST_COUNT = 8

export function keepOnlyFixedRequests(): void {
  const database = getMockDatabase()
  database.requestRecords = database.requestRecords.filter(
    (record) => Number(record.request.id.replace('req-', '')) <= FIXED_REQUEST_COUNT,
  )
}
