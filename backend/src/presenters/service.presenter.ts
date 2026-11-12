import { CategoryView, toCategoryView } from './category.presenter.js';
import type { PriceUnit, ServiceStatus } from '../types/index.js';
import { EquipmentView, toEquipmentView } from './equipment.presenter.js';
import { ProviderView, toProviderView } from './provider.presenter.js';
import { roundRating } from '../utils/ratings.js';
import type { Service } from '../entities/service.entity.js';

export interface ServiceView {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  providerId: string;
  providerName: string;
  providerVerified: boolean;
  city: string;
  state: string;
  price: number;
  priceUnit: PriceUnit;
  rating: number;
  reviewCount: number;
  available: boolean;
  imageUrl: string;
  photos: string[];
  equipmentIds: string[];
  status: ServiceStatus;
  hiddenReason?: string;
  createdAt: string;
}

export interface ServiceDetailView extends ServiceView {
  provider: ProviderView;
  category: CategoryView;
  equipment: EquipmentView[];
}

export function isServiceVisible(service: Service): boolean {
  // Regra geral de visibilidade do catálogo (seção 10 do contrato)
  const providerActive = service.provider?.status === 'active';
  return !service.deletedAt && service.status === 'active' && providerActive;
}

export function toServiceView(service: Service, showHiddenReason = false): ServiceView {
  // Converte a entidade no tipo Service do contrato
  const profile = service.provider?.providerProfile;
  const reason = showHiddenReason ? service.hiddenReason : null;
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    categoryId: service.categoryId,
    providerId: service.providerId,
    providerName: service.provider?.name ?? '',
    providerVerified: profile?.verificationStatus === 'approved',
    city: service.city,
    state: service.state,
    price: service.price,
    priceUnit: service.priceUnit,
    rating: roundRating(service.rating),
    reviewCount: service.reviewCount,
    available: service.available,
    imageUrl: service.photos[0] ?? '',
    photos: service.photos,
    equipmentIds: (service.equipment ?? []).map((item) => item.id),
    status: service.status,
    ...(reason ? { hiddenReason: reason } : {}),
    createdAt: service.createdAt,
  };
}

export function toServiceDetailView(service: Service, showHiddenReason = false): ServiceDetailView {
  // Detalhe do serviço com prestador, categoria e equipamentos
  return {
    ...toServiceView(service, showHiddenReason),
    provider: toProviderView(service.provider!, service.provider?.providerProfile),
    category: toCategoryView(service.category!),
    equipment: (service.equipment ?? []).map(toEquipmentView),
  };
}
