import { describe, expect, it } from 'vitest'
import type { Upload, User } from '../../../types/entities'
import { callAsync, captureError, captureErrorAsync, call, tokens } from '../../../test/mockApi'
import { getMockFileId, readMockFile } from '../mockFileStore'

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

function uploadAs(token: string, overrides: Record<string, unknown> = {}) {
  return callAsync<Upload>('POST', '/uploads', {
    token,
    body: { name: 'foto.png', contentType: 'image/png', dataUrl: PNG_DATA_URL, purpose: 'public', ...overrides },
  })
}

describe('POST /uploads', () => {
  it('stores the file and returns a mockfile url', async () => {
    const upload = await uploadAs(tokens.producer)

    expect(upload).toMatchObject({ name: 'foto.png', contentType: 'image/png', purpose: 'public' })
    expect(upload.url).toBe(`mockfile:${upload.id}`)
    expect(upload.size).toBeGreaterThan(0)
    expect(await readMockFile(getMockFileId(upload.url))).toBe(PNG_DATA_URL)
  })

  it('rejects unsupported types and files over 5 MB', async () => {
    const wrongType = await captureErrorAsync(() =>
      uploadAs(tokens.producer, { contentType: 'image/gif', dataUrl: 'data:image/gif;base64,R0lGOD' }),
    )
    expect(wrongType.fields).toEqual({ file: 'Envie uma imagem JPG, PNG ou WEBP, ou um PDF.' })

    const big = `data:application/pdf;base64,${'A'.repeat(Math.ceil((5 * 1024 * 1024 * 4) / 3) + 8)}`
    const tooBig = await captureErrorAsync(() => uploadAs(tokens.producer, { contentType: 'application/pdf', dataUrl: big }))
    expect(tooBig.fields).toEqual({ file: 'O arquivo deve ter no máximo 5 MB.' })
  })

  it('requires a session', async () => {
    expect((await captureErrorAsync(() => uploadAs(''))).status).toBe(401)
  })
})

describe('PATCH /me avatarUrl', () => {
  it('accepts an own public upload and removes it with null', async () => {
    const upload = await uploadAs(tokens.producer)

    expect(call<User>('PATCH', '/me', { token: tokens.producer, body: { avatarUrl: upload.url } }).avatarUrl).toBe(upload.url)
    expect(call<User>('PATCH', '/me', { token: tokens.producer, body: { avatarUrl: null } }).avatarUrl).toBeUndefined()
  })

  it('rejects uploads from another user, verification files and external urls', async () => {
    const foreign = await uploadAs(tokens.provider)
    const document = await uploadAs(tokens.producer, { purpose: 'verification' })

    for (const avatarUrl of [foreign.url, document.url, 'https://example.com/a.png']) {
      const error = captureError(() => call('PATCH', '/me', { token: tokens.producer, body: { avatarUrl } }))
      expect(error.fields).toEqual({ avatarUrl: 'Use apenas imagens enviadas por você.' })
    }
  })
})
