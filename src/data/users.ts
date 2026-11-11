import type { User } from '../types/entities'

export interface UserCredential {
  userId: string
  password: string
}

const createdAt = '2026-01-01T00:00:00.000Z'

export const users: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Henrique Souza',
    email: 'produtor@agroserv.com',
    role: 'producer',
    city: 'Santa Helena',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-1',
    name: 'Agro Máquinas Paraná',
    email: 'prestador@agroserv.com',
    role: 'provider',
    city: 'Santa Helena',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-2',
    name: 'Campo Forte Serviços',
    email: 'prestador2@agroserv.com',
    role: 'provider',
    city: 'Cascavel',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-3',
    name: 'Irriga Sul Tecnologia',
    email: 'prestador3@agroserv.com',
    role: 'provider',
    city: 'Toledo',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-4',
    name: 'Transportes Vale Verde',
    email: 'prestador4@agroserv.com',
    role: 'provider',
    city: 'Marechal Cândido Rondon',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-5',
    name: 'Mecânica Rural Oeste',
    email: 'prestador5@agroserv.com',
    role: 'provider',
    city: 'Medianeira',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'prv-6',
    name: 'Semear Agrícola',
    email: 'prestador6@agroserv.com',
    role: 'provider',
    city: 'Palotina',
    state: 'PR',
    status: 'active',
    createdAt,
  },
  {
    id: 'adm-1',
    name: 'Administrador AgroServ',
    email: 'admin@agroserv.com',
    role: 'admin',
    city: 'Santa Helena',
    state: 'PR',
    status: 'active',
    createdAt,
  },
]

export const userCredentials: UserCredential[] = [
  { userId: 'usr-1', password: '123456' },
  { userId: 'prv-1', password: '123456' },
  { userId: 'prv-2', password: '123456' },
  { userId: 'prv-3', password: '123456' },
  { userId: 'prv-4', password: '123456' },
  { userId: 'prv-5', password: '123456' },
  { userId: 'prv-6', password: '123456' },
  { userId: 'adm-1', password: '123456' },
]