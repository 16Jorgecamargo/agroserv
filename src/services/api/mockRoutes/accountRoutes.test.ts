import { describe, expect, it } from 'vitest'
import { getMockDatabase } from '../mockDatabase'
import { handleMockRequest } from '../mockRoutes'
import { ApiError } from '../apiError'

function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, token: string | null = null): T {
  return handleMockRequest({ method, path, body, token }) as T
}

function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected ApiError to be thrown')
}

describe('account mock routes', () => {
  it('updates personal data, persists it and updates the provider summary', () => {
    const updated = request<{ name: string; phone: string; city: string; state: string }>(
      'PATCH',
      '/me',
      { name: ' Carlos Souza ', phone: '(45) 98888-7777', city: ' Toledo ', state: 'pr' },
      'mock.prv-1',
    )

    expect(updated).toMatchObject({ name: 'Carlos Souza', phone: '(45) 98888-7777', city: 'Toledo', state: 'PR' })
    expect(getMockDatabase().providers.find((provider) => provider.id === 'prv-1')).toMatchObject({
      name: 'Carlos Souza',
      city: 'Toledo',
      state: 'PR',
    })
    expect(JSON.parse(localStorage.getItem('agroserv_mock_db') ?? '{}').database.users.find((user: { id: string }) => user.id === 'prv-1').city).toBe('Toledo')
  })

  it('rejects invalid personal fields without partially changing the profile', () => {
    const error = captureError(() =>
      request('PATCH', '/me', { name: 'Nome válido', phone: '123', state: 'XX' }, 'mock.usr-1'),
    )

    expect(error.status).toBe(422)
    expect(error.fields).toEqual({ phone: 'Informe um telefone válido.', state: 'Selecione a UF.' })
    expect(getMockDatabase().users.find((user) => user.id === 'usr-1')?.name).toBe('Carlos Henrique Souza')
  })

  it('changes password only when the current password is correct and the new one is valid', () => {
    const credential = getMockDatabase().userCredentials.find((entry) => entry.userId === 'usr-1')
    if (!credential) throw new Error('Demo producer credential not found')
    credential.password = 'senha-atual-segura'
    const wrongPassword = captureError(() =>
      request('PATCH', '/me/password', { currentPassword: 'errada', newPassword: 'senha-nova-segura' }, 'mock.usr-1'),
    )
    expect(wrongPassword.fields).toEqual({ currentPassword: 'Senha atual incorreta.' })

    const samePassword = captureError(() =>
      request('PATCH', '/me/password', { currentPassword: 'senha-atual-segura', newPassword: 'senha-atual-segura' }, 'mock.usr-1'),
    )
    expect(samePassword.fields).toEqual({ newPassword: 'A nova senha precisa ser diferente da atual.' })

    expect(request('PATCH', '/me/password', { currentPassword: 'senha-atual-segura', newPassword: 'senha-nova-segura' }, 'mock.usr-1')).toEqual({ message: 'Senha alterada.' })
    expect(getMockDatabase().userCredentials.find((credential) => credential.userId === 'usr-1')?.password).toBe('senha-nova-segura')
  })

  it('validates provider role and updates the professional profile', () => {
    const forbidden = captureError(() => request('GET', '/provider/profile', undefined, 'mock.usr-1'))
    expect(forbidden.status).toBe(403)

    const result = request<{ document: string; verificationStatus: string; serviceRadiusKm: number }>(
      'PATCH',
      '/provider/profile',
      { document: '98765432100', serviceRadiusKm: 180, yearsOfExperience: 15, description: 'Atendimento especializado.' },
      'mock.prv-1',
    )
    expect(result).toMatchObject({ document: '98765432100', verificationStatus: 'not_sent', serviceRadiusKm: 180 })
    expect(getMockDatabase().providers.find((provider) => provider.id === 'prv-1')).toMatchObject({
      serviceRadiusKm: 180,
      yearsOfExperience: 15,
      description: 'Atendimento especializado.',
      verified: false,
    })
  })

  it('blocks deletion for active requests and administrator accounts', () => {
    const producerError = captureError(() => request('DELETE', '/me', undefined, 'mock.usr-1'))
    expect(producerError.status).toBe(409)
    expect(producerError.message).toBe('Você tem solicitações em andamento. Conclua ou cancele antes de excluir a conta.')

    const adminError = captureError(() => request('DELETE', '/me', undefined, 'mock.adm-1'))
    expect(adminError.status).toBe(403)
  })

  it('logically deletes a provider and hides their services', () => {
    expect(request('DELETE', '/me', undefined, 'mock.prv-5')).toEqual({ message: 'Conta excluída.' })
    expect(getMockDatabase().users.find((user) => user.id === 'prv-5')).toMatchObject({ status: 'deleted' })
    expect(getMockDatabase().services.filter((service) => service.providerId === 'prv-5').every((service) => !service.available)).toBe(true)
    expect(captureError(() => request('GET', '/services/svc-7')).status).toBe(404)
  })

  it('restores the mock seed', () => {
    getMockDatabase().categories[0].name = 'Alterada'
    request('POST', '/mock/restore-demo')
    expect(getMockDatabase().categories[0].name).toBe('Plantio')
    expect(getMockDatabase().users.find((user) => user.id === 'prv-1')?.phone).toBe('(45) 99999-0002')
  })
})
