import type { User } from '../types/entities'

export interface UserCredential {
  userId: string
  password: string
}

export const users: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Henrique Souza',
    email: 'produtor@agroserv.com',
    role: 'producer',
    city: 'Santa Helena',
    state: 'PR',
  },
]

export const userCredentials: UserCredential[] = [{ userId: 'usr-1', password: '123456' }]
