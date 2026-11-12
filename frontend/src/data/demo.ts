import type {
  AdminAction,
  Equipment,
  Message,
  Notification,
  Report,
  Review,
  Upload,
  VerificationDocument,
} from '../types/entities'
import { addDays, daysAgoIso, getTodayInBrasilia } from '../utils/date'

export interface NotificationRecord extends Notification {
  userId: string
}

export interface FavoriteRecord {
  producerId: string
  serviceId: string
  createdAt: string
}

export interface BlockedDayRecord {
  providerId: string
  date: string
}

export interface UploadRecord extends Upload {
  ownerId: string
}

export interface VerificationRecord {
  providerId: string
  documents: VerificationDocument[]
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

const documentPlaceholder = (title: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" rx="24" fill="#EEF1EC"/><rect x="40" y="40" width="560" height="340" rx="16" fill="#fff" stroke="#E4E8E1" stroke-width="4"/><text x="320" y="200" font-family="sans-serif" font-size="30" font-weight="700" fill="#173F2A" text-anchor="middle">${title}</text><text x="320" y="245" font-family="sans-serif" font-size="20" fill="#667085" text-anchor="middle">Documento de demonstração</text></svg>`,
  )}`

export const equipment: Equipment[] = [
  {
    id: 'eqp-1',
    providerId: 'prv-1',
    type: 'sprayer',
    model: 'Jacto Uniport 3030',
    year: 2022,
    specs: 'Barra de 30 m, tanque de 3000 L, controle de seção por GPS.',
    photos: [],
  },
  {
    id: 'eqp-2',
    providerId: 'prv-1',
    type: 'tractor',
    model: 'John Deere 6125J',
    year: 2020,
    specs: '125 cv, piloto automático e distribuidor a taxa variável.',
    photos: [],
  },
]

const reviewCreatedAt = daysAgoIso(3)

export const reviews: Review[] = [
  {
    id: 'rev-1',
    requestId: 'req-4',
    serviceId: 'svc-5',
    serviceTitle: 'Aplicação de Fertilizantes a Taxa Variável',
    providerId: 'prv-1',
    producerId: 'usr-1',
    producerName: 'Carlos Henrique Souza',
    rating: 5,
    comment: 'Aplicação uniforme e equipe pontual. Recomendo.',
    reply: { text: 'Obrigado pela confiança, Carlos!', createdAt: daysAgoIso(2), updatedAt: daysAgoIso(2) },
    hidden: false,
    editableUntil: new Date(Date.parse(reviewCreatedAt) + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: reviewCreatedAt,
    updatedAt: reviewCreatedAt,
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    requestId: 'req-10',
    senderId: 'usr-1',
    senderName: 'Carlos Henrique Souza',
    senderRole: 'producer',
    text: 'Bom dia! O mapa de fertilidade já está pronto, posso enviar por aqui?',
    createdAt: daysAgoIso(3, 14),
  },
  {
    id: 'msg-2',
    requestId: 'req-10',
    senderId: 'prv-1',
    senderName: 'Agro Máquinas Paraná',
    senderRole: 'provider',
    text: 'Bom dia, Carlos. Pode sim, levamos o equipamento calibrado no dia.',
    createdAt: daysAgoIso(3, 15),
  },
]

export const reports: Report[] = [
  {
    id: 'rep-1',
    reporterId: 'usr-1',
    reporterName: 'Carlos Henrique Souza',
    reporterRole: 'producer',
    targetType: 'service',
    targetId: 'svc-12',
    targetLabel: 'Manutenção de Sistemas de Irrigação',
    reason: 'false_info',
    description: 'O anúncio informa atendimento em toda a região, mas o prestador não atende Santa Helena.',
    status: 'open',
    createdAt: daysAgoIso(1),
  },
]

export const notifications: NotificationRecord[] = [
  {
    id: 'ntf-1',
    userId: 'prv-1',
    type: 'request_created',
    title: 'Nova solicitação: Pulverização Agrícola',
    link: '/prestador/solicitacoes/req-14',
    read: false,
    createdAt: daysAgoIso(2),
  },
  {
    id: 'ntf-2',
    userId: 'usr-1',
    type: 'counter_offer',
    title: 'Você recebeu uma contraproposta',
    link: '/solicitacoes/req-9',
    read: false,
    createdAt: daysAgoIso(2),
  },
  {
    id: 'ntf-3',
    userId: 'usr-1',
    type: 'request_status',
    title: 'Sua solicitação foi agendada',
    link: '/solicitacoes/req-10',
    read: true,
    createdAt: daysAgoIso(3),
  },
  {
    id: 'ntf-4',
    userId: 'adm-1',
    type: 'report_created',
    title: 'Nova denúncia: Informação falsa',
    link: '/admin/denuncias',
    read: false,
    createdAt: daysAgoIso(1),
  },
  {
    id: 'ntf-5',
    userId: 'adm-1',
    type: 'verification_submitted',
    title: 'Nova verificação de Irriga Sul Tecnologia',
    link: '/admin/verificacoes',
    read: false,
    createdAt: daysAgoIso(3),
  },
]

export const favorites: FavoriteRecord[] = [{ producerId: 'usr-1', serviceId: 'svc-3', createdAt: daysAgoIso(9) }]

export const blockedDays: BlockedDayRecord[] = [{ providerId: 'prv-1', date: addDays(getTodayInBrasilia(), 15) }]

export const uploads: UploadRecord[] = [
  {
    id: 'upl-prv-3-identity',
    ownerId: 'prv-3',
    url: documentPlaceholder('Documento de identidade'),
    name: 'documento.png',
    contentType: 'image/svg+xml',
    size: 2048,
    purpose: 'verification',
    createdAt: daysAgoIso(3),
  },
  {
    id: 'upl-prv-3-address',
    ownerId: 'prv-3',
    url: documentPlaceholder('Comprovante de endereço'),
    name: 'comprovante.png',
    contentType: 'image/svg+xml',
    size: 2048,
    purpose: 'verification',
    createdAt: daysAgoIso(3),
  },
]

export const verifications: VerificationRecord[] = [
  { providerId: 'prv-1', documents: [], submittedAt: daysAgoIso(100), reviewedAt: daysAgoIso(98) },
  { providerId: 'prv-2', documents: [], submittedAt: daysAgoIso(100), reviewedAt: daysAgoIso(98) },
  {
    providerId: 'prv-3',
    documents: [
      { kind: 'identity', uploadId: 'upl-prv-3-identity', url: uploads[0].url, name: uploads[0].name },
      { kind: 'address', uploadId: 'upl-prv-3-address', url: uploads[1].url, name: uploads[1].name },
    ],
    submittedAt: daysAgoIso(3),
  },
  { providerId: 'prv-6', documents: [], submittedAt: daysAgoIso(100), reviewedAt: daysAgoIso(98) },
]

export const adminActions: AdminAction[] = [
  {
    id: 'act-1',
    adminId: 'adm-1',
    adminName: 'Administrador AgroServ',
    action: 'approve_verification',
    targetType: 'verification',
    targetId: 'prv-1',
    targetLabel: 'Agro Máquinas Paraná',
    createdAt: daysAgoIso(98),
  },
]
