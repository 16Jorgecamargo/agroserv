import type {
  ActorRole, PriceUnit, RequestAction, RequestEventType, RequestStatus,
} from '../common/types.js';
import { PropertyView, toPropertyView } from '../properties/property.presenter.js';
import { ProviderView, toProviderView } from '../providers/provider.presenter.js';
import { ServiceView, toServiceView } from '../services/service.presenter.js';
import type { User } from '../users/entities/user.entity.js';
import type { RequestEvent } from './entities/request-event.entity.js';
import type { ServiceRequest } from './entities/service-request.entity.js';

export interface CounterOfferView {
  date?: string;
  value?: number;
  message: string;
  createdAt: string;
}

export interface RequestView {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  producerId: string;
  producerName: string;
  propertyId: string;
  location: string;
  scheduledDate: string;
  quantity: number;
  priceUnit: PriceUnit;
  value: number;
  notes?: string;
  status: RequestStatus;
  counterOffer?: CounterOfferView;
  rejectReason?: string;
  cancelReason?: string;
  cancelledBy?: ActorRole;
  reviewId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestEventView {
  id: string;
  type: RequestEventType;
  actorId: string | null;
  actorRole: ActorRole;
  actorName: string;
  note?: string;
  previousDate?: string;
  previousValue?: number;
  createdAt: string;
}

export interface RequestPartyView {
  id: string;
  name: string;
  avatarUrl?: string;
  city: string;
  state: string;
  phone?: string;
}

export interface RequestDetailView<TReview = unknown> extends RequestView {
  service: ServiceView;
  serviceRemoved: boolean;
  property: PropertyView;
  propertyRemoved: boolean;
  producer: RequestPartyView;
  provider: ProviderView & { phone?: string };
  events: RequestEventView[];
  review?: TReview;
  allowedActions: RequestAction[];
}

export interface DetailOptions<TReview> {
  showPhones: boolean;
  allowedActions: RequestAction[];
  review?: TReview;
}

export function toRequestView(request: ServiceRequest): RequestView {
  // Converte a entidade no tipo ServiceRequest do contrato
  const counterOffer = request.counterMessage
    ? {
        ...(request.counterDate ? { date: request.counterDate } : {}),
        ...(request.counterValue !== null ? { value: request.counterValue } : {}),
        message: request.counterMessage,
        createdAt: request.counterCreatedAt ?? request.updatedAt,
      }
    : undefined;
  return {
    id: request.id,
    serviceId: request.serviceId,
    serviceTitle: request.serviceTitle,
    providerId: request.providerId,
    providerName: request.providerName,
    producerId: request.producerId,
    producerName: request.producerName,
    propertyId: request.propertyId,
    location: request.location,
    scheduledDate: request.scheduledDate,
    quantity: request.quantity,
    priceUnit: request.priceUnit,
    value: request.value,
    ...(request.notes ? { notes: request.notes } : {}),
    status: request.status,
    ...(counterOffer ? { counterOffer } : {}),
    ...(request.rejectReason ? { rejectReason: request.rejectReason } : {}),
    ...(request.cancelReason ? { cancelReason: request.cancelReason } : {}),
    ...(request.cancelledBy ? { cancelledBy: request.cancelledBy } : {}),
    ...(request.reviewId ? { reviewId: request.reviewId } : {}),
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function toEventView(event: RequestEvent): RequestEventView {
  // Converte um evento da linha do tempo
  return {
    id: event.id,
    type: event.type,
    actorId: event.actorId,
    actorRole: event.actorRole,
    actorName: event.actorName,
    ...(event.note ? { note: event.note } : {}),
    ...(event.previousDate ? { previousDate: event.previousDate } : {}),
    ...(event.previousValue !== null ? { previousValue: event.previousValue } : {}),
    createdAt: event.createdAt,
  };
}

function toPartyView(user: User, showPhone: boolean): RequestPartyView {
  // Dados do produtor; o telefone só aparece depois de agendado
  return {
    id: user.id,
    name: user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    city: user.city,
    state: user.state,
    ...(showPhone && user.phone ? { phone: user.phone } : {}),
  };
}

export function toRequestDetailView<TReview>(
  request: ServiceRequest,
  options: DetailOptions<TReview>,
): RequestDetailView<TReview> {
  // Linha do tempo em ordem cronológica crescente
  const events = [...(request.events ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const provider = request.provider!;
  const phone = options.showPhones && provider.phone ? { phone: provider.phone } : {};

  // Serviço e propriedade continuam vindo mesmo depois de removidos
  return {
    ...toRequestView(request),
    service: toServiceView(request.service!),
    serviceRemoved: !!request.service?.deletedAt,
    property: toPropertyView(request.property!),
    propertyRemoved: !!request.property?.deletedAt,
    producer: toPartyView(request.producer!, options.showPhones),
    provider: { ...toProviderView(provider, provider.providerProfile), ...phone },
    events: events.map(toEventView),
    ...(options.review ? { review: options.review } : {}),
    allowedActions: options.allowedActions,
  };
}
