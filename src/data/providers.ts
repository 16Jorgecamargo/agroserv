import type { Provider, ProviderProfile, VerificationStatus } from '../types/entities'

interface ProviderSeed extends ProviderProfile {
  name: string
  city: string
  state: string
}

const providerSeed: ProviderSeed[] = [
  {
    userId: 'prv-1',
    name: 'Agro Máquinas Paraná',
    city: 'Santa Helena',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 12,
    description: 'Prestador de serviços agrícolas na região de Santa Helena - PR.',
    verificationStatus: 'approved',
    rating: 4.9,
    reviewCount: 186,
  },
  {
    userId: 'prv-2',
    name: 'Campo Forte Serviços',
    city: 'Cascavel',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 9,
    description: 'Prestador de serviços agrícolas na região de Cascavel - PR.',
    verificationStatus: 'approved',
    rating: 4.8,
    reviewCount: 161,
  },
  {
    userId: 'prv-3',
    name: 'Irriga Sul Tecnologia',
    city: 'Toledo',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 7,
    description: 'Prestador de serviços agrícolas na região de Toledo - PR.',
    verificationStatus: 'under_review',
    rating: 4.7,
    reviewCount: 106,
  },
  {
    userId: 'prv-4',
    name: 'Transportes Vale Verde',
    city: 'Marechal Cândido Rondon',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 15,
    description: 'Prestador de serviços agrícolas na região de Marechal Cândido Rondon - PR.',
    verificationStatus: 'not_sent',
    rating: 4.6,
    reviewCount: 140,
  },
  {
    userId: 'prv-5',
    name: 'Mecânica Rural Oeste',
    city: 'Medianeira',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 20,
    description: 'Prestador de serviços agrícolas na região de Medianeira - PR.',
    verificationStatus: 'not_sent',
    rating: 4.8,
    reviewCount: 87,
  },
  {
    userId: 'prv-6',
    name: 'Semear Agrícola',
    city: 'Palotina',
    state: 'PR',
    document: '',
    serviceRadiusKm: 100,
    yearsOfExperience: 6,
    description: 'Prestador de serviços agrícolas na região de Palotina - PR.',
    verificationStatus: 'approved',
    rating: 4.9,
    reviewCount: 145,
  },
]

export const providers: Provider[] = providerSeed.map((provider) => ({
  id: provider.userId,
  name: provider.name,
  city: provider.city,
  state: provider.state,
  rating: provider.rating,
  reviewCount: provider.reviewCount,
  yearsOfExperience: provider.yearsOfExperience,
  verified: provider.verificationStatus === 'approved',
  serviceRadiusKm: provider.serviceRadiusKm,
  description: provider.description,
}))

export const providerProfiles: ProviderProfile[] = providerSeed.map(
  ({
    userId,
    document,
    serviceRadiusKm,
    yearsOfExperience,
    description,
    verificationStatus,
    rating,
    reviewCount,
  }) => ({
    userId,
    document,
    serviceRadiusKm,
    yearsOfExperience,
    description,
    verificationStatus: verificationStatus as VerificationStatus,
    rating,
    reviewCount,
  }),
)