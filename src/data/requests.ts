import type { Property, RequestEvent, RequestEventType, RequestStatus, ServiceRequest } from '../types/entities'
import { addDays, daysAgoIso, getTodayInBrasilia } from '../utils/date'
import { properties, toProperty } from './properties'

export interface RequestRecord {
  producerId: string
  request: ServiceRequest
  property: Property
  events: RequestEvent[]
}

function createEvent(
  requestId: string,
  index: number,
  type: RequestEventType,
  actorId: string,
  actorRole: 'producer' | 'provider',
  actorName: string,
  createdAt: string,
  note?: string,
): RequestEvent {
  return {
    id: `evt-${requestId}-${index}`,
    type,
    actorId,
    actorRole,
    actorName,
    createdAt,
    ...(note ? { note } : {}),
  }
}

function createRequestRecord(
  request: ServiceRequest,
  property: Property,
  eventSpecs: Array<[RequestEventType, string, 'producer' | 'provider', string, string, string?]>,
): RequestRecord {
  return {
    producerId: request.producerId,
    request,
    property,
    events: eventSpecs.map(([type, actorId, actorRole, actorName, createdAt, note], index) =>
      createEvent(request.id, index + 1, type, actorId, actorRole, actorName, createdAt, note),
    ),
  }
}

const producerId = 'usr-1'
const producerName = 'Carlos Henrique Souza'

const boaVista = toProperty(properties[0])
const sitioSaoJose = toProperty(properties[1])

function request(
  id: string,
  serviceId: string,
  serviceTitle: string,
  providerId: string,
  providerName: string,
  propertyRecord: Property,
  scheduledDate: string,
  quantity: number,
  priceUnit: ServiceRequest['priceUnit'],
  value: number,
  status: RequestStatus,
  createdAt: string,
  options: Partial<ServiceRequest> = {},
): ServiceRequest {
  return {
    id,
    serviceId,
    serviceTitle,
    providerId,
    providerName,
    producerId,
    producerName,
    propertyId: propertyRecord.id,
    location: `${propertyRecord.name}, ${propertyRecord.city} - ${propertyRecord.state}`,
    scheduledDate,
    quantity,
    priceUnit,
    value,
    status,
    createdAt,
    updatedAt: options.updatedAt ?? createdAt,
    ...options,
  }
}


type RelativeEvent = [RequestEventType, number, 'producer' | 'provider', string?]

interface RelativeSpec {
  id: string
  serviceId: string
  serviceTitle: string
  price: number
  priceUnit: ServiceRequest['priceUnit']
  propertyRecord: Property
  status: RequestStatus
  dayOffset: number
  quantity: number
  events: RelativeEvent[]
  notes?: string
  counter?: { dayOffset: number; value: number; message: string }
  rejectReason?: string
  cancelReason?: string
}

const demoProvider = { id: 'prv-1', name: 'Agro Máquinas Paraná' }

function createRelativeRecords(): RequestRecord[] {
  const today = getTodayInBrasilia()
  const specs: RelativeSpec[] = [
    {
      id: 'req-9',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      price: 180,
      priceUnit: 'hour',
      propertyRecord: sitioSaoJose,
      status: 'counter_offer',
      dayOffset: 5,
      quantity: 6,
      counter: { dayOffset: 8, value: 1000, message: 'Só consigo atender três dias depois. Em troca, faço um valor melhor.' },
      events: [
        ['created', 3, 'producer'],
        ['counter_offer', 2, 'provider', 'Só consigo atender três dias depois. Em troca, faço um valor melhor.'],
      ],
    },
    {
      id: 'req-10',
      serviceId: 'svc-5',
      serviceTitle: 'Aplicação de Fertilizantes a Taxa Variável',
      price: 95,
      priceUnit: 'hectare',
      propertyRecord: boaVista,
      status: 'accepted',
      dayOffset: 3,
      quantity: 40,
      notes: 'Mapa de fertilidade já disponível.',
      events: [
        ['created', 4, 'producer'],
        ['accepted', 3, 'provider'],
      ],
    },
    {
      id: 'req-11',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      price: 180,
      priceUnit: 'hour',
      propertyRecord: boaVista,
      status: 'in_progress',
      dayOffset: -1,
      quantity: 10,
      events: [
        ['created', 8, 'producer'],
        ['accepted', 7, 'provider'],
        ['started', 1, 'provider'],
      ],
    },
    {
      id: 'req-12',
      serviceId: 'svc-5',
      serviceTitle: 'Aplicação de Fertilizantes a Taxa Variável',
      price: 95,
      priceUnit: 'hectare',
      propertyRecord: sitioSaoJose,
      status: 'rejected',
      dayOffset: 2,
      quantity: 12,
      rejectReason: 'Agenda cheia nesta semana.',
      events: [
        ['created', 6, 'producer'],
        ['rejected', 5, 'provider', 'Agenda cheia nesta semana.'],
      ],
    },
    {
      id: 'req-13',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      price: 180,
      priceUnit: 'hour',
      propertyRecord: sitioSaoJose,
      status: 'cancelled',
      dayOffset: -8,
      quantity: 5,
      cancelReason: 'Máquina em manutenção na data combinada.',
      events: [
        ['created', 20, 'producer'],
        ['accepted', 19, 'provider'],
        ['cancelled', 10, 'provider', 'Máquina em manutenção na data combinada.'],
      ],
    },
    {
      id: 'req-14',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      price: 180,
      priceUnit: 'hour',
      propertyRecord: boaVista,
      status: 'pending',
      dayOffset: 10,
      quantity: 8,
      notes: 'Aplicação de fungicida na soja.',
      events: [['created', 2, 'producer']],
    },
  ]

  return specs.map((spec) => {
    const createdAt = daysAgoIso(spec.events[0][1])
    const updatedAt = daysAgoIso(spec.events[spec.events.length - 1][1], 12 + spec.events.length - 1)
    const value = Math.round(spec.price * spec.quantity * 100) / 100
    const serviceRequest = request(
      spec.id,
      spec.serviceId,
      spec.serviceTitle,
      demoProvider.id,
      demoProvider.name,
      spec.propertyRecord,
      addDays(today, spec.dayOffset),
      spec.quantity,
      spec.priceUnit,
      value,
      spec.status,
      createdAt,
      {
        updatedAt,
        ...(spec.notes ? { notes: spec.notes } : {}),
        ...(spec.counter
          ? {
              counterOffer: {
                date: addDays(today, spec.counter.dayOffset),
                value: spec.counter.value,
                message: spec.counter.message,
                createdAt: daysAgoIso(2),
              },
            }
          : {}),
        ...(spec.rejectReason ? { rejectReason: spec.rejectReason } : {}),
        ...(spec.cancelReason ? { cancelReason: spec.cancelReason, cancelledBy: 'provider' as const } : {}),
      },
    )

    return {
      producerId,
      request: serviceRequest,
      property: spec.propertyRecord,
      events: spec.events.map(([type, days, actor, note], index) =>
        createEvent(
          spec.id,
          index + 1,
          type,
          actor === 'producer' ? producerId : demoProvider.id,
          actor,
          actor === 'producer' ? producerName : demoProvider.name,
          daysAgoIso(days, 12 + index),
          note,
        ),
      ),
    }
  })
}

export const requestRecords: RequestRecord[] = [
  createRequestRecord(
    request(
      'req-1',
      'svc-1',
      'Pulverização Agrícola',
      'prv-1',
      'Agro Máquinas Paraná',
      boaVista,
      '2026-10-15',
      8,
      'hour',
      1440,
      'counter_offer',
      '2026-10-01T13:00:00.000Z',
      {
        counterOffer: {
          date: '2026-11-20',
          value: 1600,
          message: 'Posso atender na nova data e ajustar o custo de deslocamento.',
          createdAt: '2026-10-03T14:00:00.000Z',
        },
        updatedAt: '2026-10-03T14:00:00.000Z',
      },
    ),
    boaVista,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-10-01T13:00:00.000Z'],
      [
        'counter_offer',
        'prv-1',
        'provider',
        'Agro Máquinas Paraná',
        '2026-10-03T14:00:00.000Z',
        'Posso atender na nova data e ajustar o custo de deslocamento.',
      ],
    ],
  ),
  createRequestRecord(
    request(
      'req-2',
      'svc-2',
      'Colheita de Soja e Milho',
      'prv-2',
      'Campo Forte Serviços',
      boaVista,
      '2026-10-05',
      15,
      'hectare',
      3750,
      'in_progress',
      '2026-09-20T12:00:00.000Z',
      { updatedAt: '2026-10-05T12:00:00.000Z' },
    ),
    boaVista,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-09-20T12:00:00.000Z'],
      ['accepted', 'prv-2', 'provider', 'Campo Forte Serviços', '2026-09-21T12:00:00.000Z'],
      ['started', 'prv-2', 'provider', 'Campo Forte Serviços', '2026-10-05T12:00:00.000Z'],
    ],
  ),
  createRequestRecord(
    request(
      'req-3',
      'svc-3',
      'Plantio Direto de Precisão',
      'prv-6',
      'Semear Agrícola',
      sitioSaoJose,
      '2026-10-20',
      10,
      'hectare',
      2100,
      'accepted',
      '2026-09-25T13:00:00.000Z',
      { updatedAt: '2026-09-26T13:00:00.000Z' },
    ),
    sitioSaoJose,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-09-25T13:00:00.000Z'],
      ['accepted', 'prv-6', 'provider', 'Semear Agrícola', '2026-09-26T13:00:00.000Z'],
    ],
  ),
  createRequestRecord(
    request(
      'req-4',
      'svc-5',
      'Aplicação de Fertilizantes a Taxa Variável',
      'prv-1',
      'Agro Máquinas Paraná',
      sitioSaoJose,
      '2026-09-12',
      10,
      'hectare',
      950,
      'completed',
      '2026-09-01T12:00:00.000Z',
      { updatedAt: '2026-09-12T17:00:00.000Z', reviewId: 'rev-1' },
    ),
    sitioSaoJose,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-09-01T12:00:00.000Z'],
      ['accepted', 'prv-1', 'provider', 'Agro Máquinas Paraná', '2026-09-02T12:00:00.000Z'],
      ['started', 'prv-1', 'provider', 'Agro Máquinas Paraná', '2026-09-12T09:00:00.000Z'],
      ['completed', 'prv-1', 'provider', 'Agro Máquinas Paraná', '2026-09-12T17:00:00.000Z'],
    ],
  ),
  createRequestRecord(
    request(
      'req-5',
      'svc-6',
      'Transporte de Grãos',
      'prv-4',
      'Transportes Vale Verde',
      boaVista,
      '2026-09-03',
      2,
      'trip',
      1700,
      'completed',
      '2026-08-30T12:00:00.000Z',
      { updatedAt: '2026-09-03T18:00:00.000Z' },
    ),
    boaVista,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-08-30T12:00:00.000Z'],
      ['accepted', 'prv-4', 'provider', 'Transportes Vale Verde', '2026-08-31T12:00:00.000Z'],
      ['started', 'prv-4', 'provider', 'Transportes Vale Verde', '2026-09-03T08:00:00.000Z'],
      ['completed', 'prv-4', 'provider', 'Transportes Vale Verde', '2026-09-03T18:00:00.000Z'],
    ],
  ),
  createRequestRecord(
    request(
      'req-6',
      'svc-7',
      'Manutenção de Colheitadeiras',
      'prv-5',
      'Mecânica Rural Oeste',
      boaVista,
      '2026-08-28',
      8,
      'hour',
      1280,
      'cancelled',
      '2026-08-20T12:00:00.000Z',
      {
        cancelReason: 'A máquina ficou indisponível.',
        cancelledBy: 'producer',
        updatedAt: '2026-08-22T12:00:00.000Z',
      },
    ),
    boaVista,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-08-20T12:00:00.000Z'],
      ['cancelled', 'usr-1', 'producer', producerName, '2026-08-22T12:00:00.000Z', 'A máquina ficou indisponível.'],
    ],
  ),
  createRequestRecord(
    request(
      'req-7',
      'svc-8',
      'Locação de Trator com Operador',
      'prv-2',
      'Campo Forte Serviços',
      sitioSaoJose,
      '2026-08-15',
      8,
      'hour',
      1760,
      'rejected',
      '2026-08-10T12:00:00.000Z',
      {
        rejectReason: 'O equipamento não estará disponível nessa data.',
        updatedAt: '2026-08-11T12:00:00.000Z',
      },
    ),
    sitioSaoJose,
    [
      ['created', 'usr-1', 'producer', producerName, '2026-08-10T12:00:00.000Z'],
      [
        'rejected',
        'prv-2',
        'provider',
        'Campo Forte Serviços',
        '2026-08-11T12:00:00.000Z',
        'O equipamento não estará disponível nessa data.',
      ],
    ],
  ),
  createRequestRecord(
    request(
      'req-8',
      'svc-10',
      'Pulverização com Drone',
      'prv-3',
      'Irriga Sul Tecnologia',
      boaVista,
      '2026-11-25',
      20,
      'hectare',
      1500,
      'pending',
      '2026-10-28T12:00:00.000Z',
    ),
    boaVista,
    [['created', 'usr-1', 'producer', producerName, '2026-10-28T12:00:00.000Z']],
  ),
  ...createRelativeRecords(),
]
