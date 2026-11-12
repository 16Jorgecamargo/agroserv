import type { MockUploadPayload } from '../../../types/api'
import type { Upload, UploadPurpose } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { MOCK_FILE_PREFIX, saveMockFile } from '../mockFileStore'
import { findUserByToken, getBody, nextId, textField, throwIfFields } from './shared'
import type { MockRoute, RouteContext } from './types'

export const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

async function createUpload({ token, body }: RouteContext): Promise<Upload> {
  const user = findUserByToken(token)
  const payload = getBody(body) as Partial<MockUploadPayload>
  const fields: Record<string, string> = {}
  const contentType = textField(payload.contentType)
  const dataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl : ''
  const purpose = (payload.purpose ?? 'public') as UploadPurpose
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl)

  if (!ACCEPTED_UPLOAD_TYPES.includes(contentType) || !match || match[1] !== contentType) {
    fields.file = 'Envie uma imagem JPG, PNG ou WEBP, ou um PDF.'
  } else if (decodedSize(match[2]) > MAX_UPLOAD_BYTES) {
    fields.file = 'O arquivo deve ter no máximo 5 MB.'
  }
  if (purpose !== 'public' && purpose !== 'verification') fields.purpose = 'Use public ou verification.'
  throwIfFields(fields)

  const database = getMockDatabase()
  const id = nextId('upl', database.uploads.map((upload) => upload.id))
  const upload: Upload = {
    id,
    url: `${MOCK_FILE_PREFIX}${id}`,
    name: (textField(payload.name) || 'arquivo').slice(0, 200),
    contentType,
    size: decodedSize(match?.[2] ?? ''),
    purpose,
    createdAt: new Date().toISOString(),
  }

  await saveMockFile(id, dataUrl)
  database.uploads.push({ ...upload, ownerId: user.id })
  persistMockDatabase()
  return upload
}

export const uploadRoutes: MockRoute[] = [{ method: 'POST', pattern: '/uploads', handle: createUpload }]
