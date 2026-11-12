import { users } from '../data/users'
import { saveSession } from '../utils/storage'

export function signInAsDemoProducer() {
  saveSession('mock.usr-1', users[0])
}

export function signInAsDemoProvider() {
  const provider = users.find((user) => user.id === 'prv-1')
  if (!provider) throw new Error('Demo provider account not found')
  saveSession(`mock.${provider.id}`, provider)
}

export function signInAsDemoAdmin() {
  const admin = users.find((user) => user.role === 'admin')
  if (!admin) throw new Error('Demo admin account not found')
  saveSession(`mock.${admin.id}`, admin)
}
