import type { VerificationStatus } from '../common/types.js';
import { roundRating } from '../reviews/ratings.js';
import type { User } from '../users/entities/user.entity.js';
import type { ProviderProfile } from './entities/provider-profile.entity.js';

export interface ProviderProfileView {
  userId: string;
  document: string;
  serviceRadiusKm: number;
  yearsOfExperience: number;
  description: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string;
  rating: number;
  reviewCount: number;
}

export interface ProviderView {
  id: string;
  name: string;
  avatarUrl?: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  verified: boolean;
  serviceRadiusKm: number;
  description: string;
}

export function toProviderProfileView(profile: ProviderProfile): ProviderProfileView {
  // Converte o perfil profissional no tipo ProviderProfile do contrato
  const reason = profile.verificationRejectionReason;
  return {
    userId: profile.userId,
    document: profile.document,
    serviceRadiusKm: profile.serviceRadiusKm,
    yearsOfExperience: profile.yearsOfExperience,
    description: profile.description,
    verificationStatus: profile.verificationStatus,
    ...(reason ? { verificationRejectionReason: reason } : {}),
    rating: roundRating(profile.rating),
    reviewCount: profile.reviewCount,
  };
}

export function toProviderView(user: User, profile?: ProviderProfile | null): ProviderView {
  // Visão pública do prestador, sem documento
  return {
    id: user.id,
    name: user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    city: user.city,
    state: user.state,
    rating: roundRating(profile?.rating ?? 0),
    reviewCount: profile?.reviewCount ?? 0,
    yearsOfExperience: profile?.yearsOfExperience ?? 0,
    verified: profile?.verificationStatus === 'approved',
    serviceRadiusKm: profile?.serviceRadiusKm ?? 50,
    description: profile?.description ?? '',
  };
}
