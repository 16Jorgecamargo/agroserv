import type { ServiceRequest } from '../types/entities'

export interface RequestRecord {
  producerId: string
  request: ServiceRequest
}

export const requestRecords: RequestRecord[] = [
  {
    producerId: 'usr-1',
    request: {
      id: 'req-1',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      providerName: 'Agro Máquinas Paraná',
      scheduledDate: '2026-10-15',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'pending',
      value: 1440,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-2',
      serviceId: 'svc-2',
      serviceTitle: 'Colheita de Soja e Milho',
      providerName: 'Campo Forte Serviços',
      scheduledDate: '2026-10-05',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'in_progress',
      value: 3750,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-3',
      serviceId: 'svc-3',
      serviceTitle: 'Plantio Direto de Precisão',
      providerName: 'Semear Agrícola',
      scheduledDate: '2026-10-20',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'accepted',
      value: 2100,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-4',
      serviceId: 'svc-5',
      serviceTitle: 'Aplicação de Fertilizantes a Taxa Variável',
      providerName: 'Agro Máquinas Paraná',
      scheduledDate: '2026-09-12',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'completed',
      value: 950,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-5',
      serviceId: 'svc-6',
      serviceTitle: 'Transporte de Grãos',
      providerName: 'Transportes Vale Verde',
      scheduledDate: '2026-09-03',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'completed',
      value: 1700,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-6',
      serviceId: 'svc-7',
      serviceTitle: 'Manutenção de Colheitadeiras',
      providerName: 'Mecânica Rural Oeste',
      scheduledDate: '2026-08-28',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'cancelled',
      value: 1280,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-7',
      serviceId: 'svc-8',
      serviceTitle: 'Locação de Trator com Operador',
      providerName: 'Campo Forte Serviços',
      scheduledDate: '2026-08-15',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'completed',
      value: 1760,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-8',
      serviceId: 'svc-10',
      serviceTitle: 'Pulverização com Drone',
      providerName: 'Irriga Sul Tecnologia',
      scheduledDate: '2026-10-25',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'pending',
      value: 1500,
    },
  },
]
