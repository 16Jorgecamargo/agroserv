import type { CategoryIcon, PriceUnit, RequestEventType, RequestStatus, Role, VerificationStatus } from '../common/types.js';

export const DEMO_PASSWORD = '123456';

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  city: string;
  daysAgo: number;
}

export const SEED_USERS: SeedUser[] = [
  { id: 'usr-1', name: 'Carlos Henrique Souza', email: 'produtor@agroserv.com', role: 'producer', phone: '45999110001', city: 'Santa Helena', daysAgo: 200 },
  { id: 'prv-1', name: 'Agro Máquinas Paraná', email: 'prestador@agroserv.com', role: 'provider', phone: '45999220001', city: 'Santa Helena', daysAgo: 190 },
  { id: 'prv-2', name: 'Campo Forte Serviços', email: 'prestador2@agroserv.com', role: 'provider', phone: '45999220002', city: 'Cascavel', daysAgo: 180 },
  { id: 'prv-3', name: 'Irriga Sul Tecnologia', email: 'prestador3@agroserv.com', role: 'provider', phone: '45999220003', city: 'Toledo', daysAgo: 170 },
  { id: 'prv-4', name: 'Transportes Vale Verde', email: 'prestador4@agroserv.com', role: 'provider', phone: '45999220004', city: 'Marechal Cândido Rondon', daysAgo: 160 },
  { id: 'prv-5', name: 'Mecânica Rural Oeste', email: 'prestador5@agroserv.com', role: 'provider', phone: '45999220005', city: 'Medianeira', daysAgo: 150 },
  { id: 'prv-6', name: 'Semear Agrícola', email: 'prestador6@agroserv.com', role: 'provider', phone: '45999220006', city: 'Palotina', daysAgo: 140 },
  { id: 'adm-1', name: 'Administração AgroServ', email: 'admin@agroserv.com', role: 'admin', phone: '45999330001', city: 'Santa Helena', daysAgo: 210 },
];

export interface SeedProfile {
  userId: string;
  document: string;
  rating: number;
  yearsOfExperience: number;
  serviceRadiusKm: number;
  verificationStatus: VerificationStatus;
  description: string;
}

export const SEED_PROFILES: SeedProfile[] = [
  { userId: 'prv-1', document: '12345678000190', rating: 4.9, yearsOfExperience: 12, serviceRadiusKm: 80, verificationStatus: 'approved', description: 'Pulverização e fertilização com máquinas próprias e equipe treinada no oeste do Paraná.' },
  { userId: 'prv-2', document: '23456789000101', rating: 4.8, yearsOfExperience: 9, serviceRadiusKm: 120, verificationStatus: 'approved', description: 'Colheita e locação de máquinas com operadores experientes.' },
  { userId: 'prv-3', document: '34567890000112', rating: 4.7, yearsOfExperience: 7, serviceRadiusKm: 100, verificationStatus: 'under_review', description: 'Projetos de irrigação e aplicação com drones agrícolas.' },
  { userId: 'prv-4', document: '', rating: 4.6, yearsOfExperience: 15, serviceRadiusKm: 200, verificationStatus: 'not_sent', description: 'Transporte de grãos com frota rastreada.' },
  { userId: 'prv-5', document: '', rating: 4.8, yearsOfExperience: 20, serviceRadiusKm: 60, verificationStatus: 'not_sent', description: 'Manutenção de máquinas agrícolas no campo.' },
  { userId: 'prv-6', document: '67890123000145', rating: 4.9, yearsOfExperience: 6, serviceRadiusKm: 90, verificationStatus: 'approved', description: 'Plantio de precisão e preparo de solo.' },
];

export const SEED_CATEGORIES: { id: string; slug: string; name: string; icon: CategoryIcon }[] = [
  { id: 'cat-planting', slug: 'plantio', name: 'Plantio', icon: 'sprout' },
  { id: 'cat-harvest', slug: 'colheita', name: 'Colheita', icon: 'wheat' },
  { id: 'cat-irrigation', slug: 'irrigacao', name: 'Irrigação', icon: 'droplets' },
  { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can' },
  { id: 'cat-fertilizing', slug: 'fertilizacao', name: 'Fertilização', icon: 'flask-conical' },
  { id: 'cat-transport', slug: 'transporte', name: 'Transporte', icon: 'truck' },
  { id: 'cat-maintenance', slug: 'manutencao', name: 'Manutenção', icon: 'wrench' },
  { id: 'cat-machinery', slug: 'maquinas', name: 'Máquinas', icon: 'tractor' },
];

export interface SeedService {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  providerId: string;
  price: number;
  priceUnit: PriceUnit;
  rating: number;
  reviewCount: number;
  available: boolean;
  image: string;
}

export const SEED_SERVICES: SeedService[] = [
  { id: 'svc-1', title: 'Pulverização Agrícola', description: 'Pulverização terrestre com barra de 30 metros, controle de vazão por GPS e relatório de aplicação por talhão. Equipe treinada e calibração antes de cada serviço.', categoryId: 'cat-spraying', providerId: 'prv-1', price: 180, priceUnit: 'hour', rating: 4.9, reviewCount: 128, available: true, image: 'service-spraying.jpg' },
  { id: 'svc-2', title: 'Colheita de Soja e Milho', description: 'Colheitadeira com plataforma de 35 pés e monitor de produtividade. Inclui operador experiente e apoio de transbordo durante toda a operação.', categoryId: 'cat-harvest', providerId: 'prv-2', price: 250, priceUnit: 'hectare', rating: 4.8, reviewCount: 96, available: true, image: 'service-harvest.jpg' },
  { id: 'svc-3', title: 'Plantio Direto de Precisão', description: 'Plantadeira de 13 linhas com taxa variável de sementes e corte de seção automático. Ideal para soja, milho e feijão em sistema de plantio direto.', categoryId: 'cat-planting', providerId: 'prv-6', price: 210, priceUnit: 'hectare', rating: 4.9, reviewCount: 74, available: true, image: 'service-planting.jpg' },
  { id: 'svc-4', title: 'Instalação de Irrigação por Pivô', description: 'Projeto e montagem de pivô central com automação remota, dimensionamento hidráulico e treinamento da equipe da propriedade.', categoryId: 'cat-irrigation', providerId: 'prv-3', price: 1500, priceUnit: 'day', rating: 4.7, reviewCount: 31, available: false, image: 'service-irrigation.jpg' },
  { id: 'svc-5', title: 'Aplicação de Fertilizantes a Taxa Variável', description: 'Distribuição de adubo sólido guiada por mapa de fertilidade do solo, reduzindo desperdício e aumentando a uniformidade da lavoura.', categoryId: 'cat-fertilizing', providerId: 'prv-1', price: 95, priceUnit: 'hectare', rating: 4.8, reviewCount: 58, available: true, image: 'service-fertilizing.jpg' },
  { id: 'svc-6', title: 'Transporte de Grãos', description: 'Frota de caminhões graneleiros com rastreamento em tempo real para escoamento da safra até armazéns e cooperativas da região.', categoryId: 'cat-transport', providerId: 'prv-4', price: 850, priceUnit: 'trip', rating: 4.6, reviewCount: 140, available: true, image: 'service-transport.jpg' },
  { id: 'svc-7', title: 'Manutenção de Colheitadeiras', description: 'Revisão preventiva e corretiva de colheitadeiras no campo, com diagnóstico eletrônico e peças de reposição originais.', categoryId: 'cat-maintenance', providerId: 'prv-5', price: 160, priceUnit: 'hour', rating: 4.8, reviewCount: 87, available: true, image: 'service-maintenance.jpg' },
  { id: 'svc-8', title: 'Locação de Trator com Operador', description: 'Trator de 180 cv com piloto automático e operador qualificado para preparo de solo, transporte interno e apoio em diversas operações.', categoryId: 'cat-machinery', providerId: 'prv-2', price: 220, priceUnit: 'hour', rating: 4.7, reviewCount: 65, available: true, image: 'service-machinery.jpg' },
  { id: 'svc-9', title: 'Gradagem e Aragem', description: 'Preparo de solo com grade aradora e arado de discos, deixando a área nivelada e pronta para o plantio da próxima safra.', categoryId: 'cat-machinery', providerId: 'prv-6', price: 190, priceUnit: 'hectare', rating: 4.6, reviewCount: 42, available: true, image: 'service-machinery.jpg' },
  { id: 'svc-10', title: 'Pulverização com Drone', description: 'Aplicação aérea com drone agrícola de 40 litros, ideal para áreas de difícil acesso, com mapeamento prévio e relatório georreferenciado.', categoryId: 'cat-spraying', providerId: 'prv-3', price: 75, priceUnit: 'hectare', rating: 4.9, reviewCount: 53, available: true, image: 'service-drone.jpg' },
  { id: 'svc-11', title: 'Semeadura de Trigo', description: 'Semeadora de fluxo contínuo para trigo e aveia, com regulagem de profundidade e acompanhamento técnico durante a operação.', categoryId: 'cat-planting', providerId: 'prv-6', price: 180, priceUnit: 'hectare', rating: 4.7, reviewCount: 29, available: false, image: 'service-planting.jpg' },
  { id: 'svc-12', title: 'Manutenção de Sistemas de Irrigação', description: 'Inspeção de aspersores, bombas e painéis elétricos de sistemas de irrigação, com ajuste de pressão e troca de componentes desgastados.', categoryId: 'cat-maintenance', providerId: 'prv-3', price: 140, priceUnit: 'hour', rating: 4.5, reviewCount: 22, available: true, image: 'service-maintenance.jpg' },
];

export const SEED_PROPERTIES = [
  { id: 'prop-1', name: 'Fazenda Boa Vista', accessNotes: 'Entrada pela PR-488, km 12, porteira verde.', areaHectares: 120, crops: ['Soja', 'Milho'] },
  { id: 'prop-2', name: 'Sítio São José', accessNotes: 'Estrada rural da Linha São José, 3 km depois da igreja.', areaHectares: 35, crops: ['Trigo', 'Feijão'] },
];

export type SeedEvent = [type: RequestEventType, daysAgo: number, actor: 'producer' | 'provider', note?: string];

export interface SeedRequest {
  id: string;
  serviceId: string;
  propertyId: string;
  status: RequestStatus;
  dayOffset: number;
  quantity: number;
  notes?: string;
  events: SeedEvent[];
  counter?: { dayOffset: number; value: number; message: string };
  rejectReason?: string;
  cancelReason?: string;
  cancelledBy?: 'producer' | 'provider';
}

export const SEED_REQUESTS: SeedRequest[] = [
  { id: 'req-1', serviceId: 'svc-1', propertyId: 'prop-1', status: 'pending', dayOffset: 10, quantity: 8, notes: 'Aplicação de fungicida na soja.', events: [['created', 2, 'producer']] },
  { id: 'req-2', serviceId: 'svc-2', propertyId: 'prop-1', status: 'in_progress', dayOffset: -2, quantity: 15, events: [['created', 12, 'producer'], ['accepted', 11, 'provider'], ['started', 2, 'provider']] },
  { id: 'req-3', serviceId: 'svc-3', propertyId: 'prop-2', status: 'accepted', dayOffset: 7, quantity: 10, events: [['created', 6, 'producer'], ['accepted', 5, 'provider']] },
  { id: 'req-4', serviceId: 'svc-5', propertyId: 'prop-2', status: 'completed', dayOffset: -5, quantity: 10, events: [['created', 15, 'producer'], ['accepted', 14, 'provider'], ['started', 5, 'provider'], ['completed', 4, 'provider']] },
  { id: 'req-5', serviceId: 'svc-6', propertyId: 'prop-1', status: 'completed', dayOffset: -45, quantity: 2, events: [['created', 55, 'producer'], ['accepted', 54, 'provider'], ['started', 45, 'provider'], ['completed', 44, 'provider']] },
  { id: 'req-6', serviceId: 'svc-7', propertyId: 'prop-1', status: 'cancelled', dayOffset: -50, quantity: 8, cancelledBy: 'producer', events: [['created', 60, 'producer'], ['cancelled', 58, 'producer']] },
  { id: 'req-7', serviceId: 'svc-8', propertyId: 'prop-2', status: 'completed', dayOffset: -60, quantity: 8, events: [['created', 70, 'producer'], ['accepted', 69, 'provider'], ['started', 60, 'provider'], ['completed', 59, 'provider']] },
  { id: 'req-8', serviceId: 'svc-10', propertyId: 'prop-1', status: 'pending', dayOffset: 14, quantity: 20, events: [['created', 1, 'producer']] },
  { id: 'req-9', serviceId: 'svc-1', propertyId: 'prop-2', status: 'counter_offer', dayOffset: 5, quantity: 6, counter: { dayOffset: 8, value: 1000, message: 'Só consigo atender três dias depois. Em troca, faço um valor melhor.' }, events: [['created', 3, 'producer'], ['counter_offer', 2, 'provider', 'Só consigo atender três dias depois. Em troca, faço um valor melhor.']] },
  { id: 'req-10', serviceId: 'svc-5', propertyId: 'prop-1', status: 'accepted', dayOffset: 3, quantity: 40, notes: 'Mapa de fertilidade já disponível.', events: [['created', 4, 'producer'], ['accepted', 3, 'provider']] },
  { id: 'req-11', serviceId: 'svc-1', propertyId: 'prop-1', status: 'in_progress', dayOffset: -1, quantity: 10, events: [['created', 8, 'producer'], ['accepted', 7, 'provider'], ['started', 1, 'provider']] },
  { id: 'req-12', serviceId: 'svc-5', propertyId: 'prop-2', status: 'rejected', dayOffset: 2, quantity: 12, rejectReason: 'Agenda cheia nesta semana.', events: [['created', 6, 'producer'], ['rejected', 5, 'provider', 'Agenda cheia nesta semana.']] },
  { id: 'req-13', serviceId: 'svc-1', propertyId: 'prop-2', status: 'cancelled', dayOffset: -8, quantity: 5, cancelledBy: 'provider', cancelReason: 'Máquina em manutenção na data combinada.', events: [['created', 20, 'producer'], ['accepted', 19, 'provider'], ['cancelled', 10, 'provider', 'Máquina em manutenção na data combinada.']] },
];
