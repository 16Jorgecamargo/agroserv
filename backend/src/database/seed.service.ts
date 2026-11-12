import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import { AdminAction } from '../admin/entities/admin-action.entity.js';
import { BlockedDay } from '../agenda/entities/blocked-day.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { addDays, ClockService } from '../common/clock.service.js';
import { normalizeText, roundMoney } from '../common/text.js';
import { Equipment } from '../equipment/entities/equipment.entity.js';
import { Favorite } from '../favorites/entities/favorite.entity.js';
import { Message } from '../messages/entities/message.entity.js';
import { Notification } from '../notifications/entities/notification.entity.js';
import { Property } from '../properties/entities/property.entity.js';
import { ProviderProfile } from '../providers/entities/provider-profile.entity.js';
import { Report } from '../reports/entities/report.entity.js';
import { RequestEvent } from '../requests/entities/request-event.entity.js';
import { ServiceRequest } from '../requests/entities/service-request.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { Service } from '../services/entities/service.entity.js';
import { Upload } from '../uploads/entities/upload.entity.js';
import { User } from '../users/entities/user.entity.js';
import {
  DEMO_PASSWORD, SEED_CATEGORIES, SEED_PROFILES, SEED_PROPERTIES, SEED_REQUESTS,
  SEED_SERVICES, SEED_USERS,
} from './seed.data.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Semeia sozinho quando o banco ainda está vazio
    if (!this.config.getOrThrow<boolean>('seedOnStart')) return;
    const users = await this.dataSource.getRepository(User).count();
    if (users === 0) await this.seed();
  }

  async reset(): Promise<void> {
    await this.dataSource.dropDatabase();
    await this.dataSource.runMigrations();
    await this.seed();
  }

  async seed(): Promise<void> {
    // Grava os dados demo da seção 16 do contrato em uma transação
    await this.dataSource.transaction(async (manager) => {
      await this.seedUsers(manager);
      await this.seedCatalog(manager);
      await this.seedRequests(manager);
      await this.seedExtras(manager);
    });
    this.logger.log('Dados demo gravados.');
  }

  private daysAgo(days: number, hour = 12): string {
    // Momento ISO de alguns dias atrás, em horário fixo
    const base = new Date(this.clock.now().getTime() - days * DAY_MS);
    base.setUTCHours(hour, 0, 0, 0);
    return base.toISOString();
  }

  private saveFile(id: string, extension: string, source: string | Buffer): number {
    // Copia ou grava um arquivo na pasta de uploads e devolve o tamanho
    const directory = resolve(this.config.getOrThrow<string>('uploadDir'));
    mkdirSync(directory, { recursive: true });
    const target = join(directory, `${id}.${extension}`);
    if (typeof source === 'string') copyFileSync(source, target);
    else writeFileSync(target, source);
    return statSync(target).size;
  }

  private fileUrl(id: string): string {
    // URL pública de um arquivo enviado
    return `${this.config.getOrThrow<string>('publicUrl')}/uploads/${id}/file`;
  }

  private async seedUsers(manager: EntityManager): Promise<void> {
    // Contas demo com a senha 123456 em hash
    const rounds = this.config.getOrThrow<number>('bcryptRounds');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, rounds);
    const users = SEED_USERS.map((user) => ({
      ...user,
      passwordHash,
      state: 'PR',
      status: 'active' as const,
      searchText: normalizeText(`${user.name} ${user.email}`),
      termsAcceptedAt: this.daysAgo(user.daysAgo),
      createdAt: this.daysAgo(user.daysAgo),
    }));
    await manager.insert(User, users);

    // Documentos de verificação do prestador em análise
    const documents = ['identity', 'address'].map((kind) => ({
      id: `upl-prv-3-${kind}`,
      userId: 'prv-3',
      url: this.fileUrl(`upl-prv-3-${kind}`),
      name: kind === 'identity' ? 'documento.png' : 'comprovante.png',
      contentType: 'image/png',
      size: this.saveFile(`upl-prv-3-${kind}`, 'png', TINY_PNG),
      purpose: 'verification' as const,
      fileName: `upl-prv-3-${kind}.png`,
      createdAt: this.daysAgo(3),
    }));
    await manager.insert(Upload, documents);

    // Perfis profissionais com a situação de verificação de cada um
    const profiles = SEED_PROFILES.map((profile) => {
      const sent = profile.verificationStatus !== 'not_sent';
      const reviewed = profile.verificationStatus === 'approved';
      const underReview = profile.verificationStatus === 'under_review';
      const services = SEED_SERVICES.filter((item) => item.providerId === profile.userId);
      return {
        ...profile,
        reviewCount: services.reduce((sum, item) => sum + item.reviewCount, 0),
        identityUploadId: underReview ? 'upl-prv-3-identity' : null,
        addressUploadId: underReview ? 'upl-prv-3-address' : null,
        verificationSubmittedAt: sent ? this.daysAgo(underReview ? 3 : 100) : null,
        verificationReviewedAt: reviewed ? this.daysAgo(98) : null,
      };
    });
    await manager.insert(ProviderProfile, profiles);
  }

  private seedImages(): Map<string, string> {
    // Reaproveita as fotos do front-end como uploads públicos, quando existirem
    const urls = new Map<string, string>();
    const source = resolve(import.meta.dirname, '../../../src/assets/images');
    if (process.env.NODE_ENV === 'test' || !existsSync(source)) return urls;
    for (const image of new Set(SEED_SERVICES.map((service) => service.image))) {
      if (existsSync(join(source, image))) urls.set(image, image.replace('.jpg', ''));
    }
    return urls;
  }

  private async seedCatalog(manager: EntityManager): Promise<void> {
    // Categorias na ordem de cadastro
    const categories = SEED_CATEGORIES.map((category, index) => ({
      ...category,
      active: true,
      createdAt: this.daysAgo(300 - index),
    }));
    await manager.insert(Category, categories);

    // Fotos dos serviços registradas como uploads do prestador
    const images = this.seedImages();
    const source = resolve(import.meta.dirname, '../../../src/assets/images');
    const uploads = SEED_SERVICES.filter((service) => images.has(service.image)).map((service) => {
      const id = `upl-${service.id}`;
      return {
        id,
        userId: service.providerId,
        url: this.fileUrl(id),
        name: service.image,
        contentType: 'image/jpeg',
        size: this.saveFile(id, 'jpg', join(source, service.image)),
        purpose: 'public' as const,
        fileName: `${id}.jpg`,
        createdAt: this.daysAgo(120),
      };
    });
    if (uploads.length) await manager.insert(Upload, uploads);

    // Equipamentos do prestador demo
    const equipment = [
      { id: 'eqp-1', providerId: 'prv-1', type: 'sprayer' as const, model: 'Jacto Uniport 3030', year: 2022, specs: 'Barra de 30 m, tanque de 3000 L, controle de seção por GPS.', photos: [], createdAt: this.daysAgo(110) },
      { id: 'eqp-2', providerId: 'prv-1', type: 'tractor' as const, model: 'John Deere 6125J', year: 2020, specs: '125 cv, piloto automático e distribuidor a taxa variável.', photos: [], createdAt: this.daysAgo(109) },
    ];
    await manager.insert(Equipment, equipment);

    // Os 12 serviços com os mesmos ids, notas e avaliações do front-end
    const users = new Map(SEED_USERS.map((user) => [user.id, user]));
    const names = new Map(SEED_CATEGORIES.map((category) => [category.id, category.name]));
    const services = SEED_SERVICES.map(({ image, ...service }, index) => {
      const provider = users.get(service.providerId)!;
      const category = names.get(service.categoryId)!;
      const text = `${service.title} ${service.description} ${provider.name} ${category} ${provider.city}`;
      return {
        ...service,
        city: provider.city,
        state: 'PR',
        photos: images.has(image) ? [this.fileUrl(`upl-${service.id}`)] : [],
        status: 'active' as const,
        searchText: normalizeText(text),
        locationText: normalizeText(`${provider.city} PR`),
        createdAt: this.daysAgo(130 - index),
      };
    });
    await manager.insert(Service, services);

    // Vínculo dos equipamentos com os serviços do prestador demo
    const relation = manager.createQueryBuilder().relation(Service, 'equipment');
    await relation.of('svc-1').add('eqp-1');
    await relation.of('svc-5').add('eqp-2');
  }

  private async seedRequests(manager: EntityManager): Promise<void> {
    // Propriedades do produtor demo
    const properties = SEED_PROPERTIES.map((property, index) => ({
      ...property,
      producerId: 'usr-1',
      city: 'Santa Helena',
      state: 'PR',
      createdAt: this.daysAgo(195 - index),
    }));
    await manager.insert(Property, properties);

    // Solicitações em todos os status, com datas relativas a hoje
    const today = this.clock.today();
    const users = new Map(SEED_USERS.map((user) => [user.id, user]));
    const services = new Map(SEED_SERVICES.map((service) => [service.id, service]));
    const places = new Map(SEED_PROPERTIES.map((property) => [property.id, property.name]));
    const requests = SEED_REQUESTS.map((request) => {
      const service = services.get(request.serviceId)!;
      const lastEvent = request.events[request.events.length - 1];
      const systemReason = request.cancelledBy === 'producer' ? null : (request.cancelReason ?? null);
      return {
        id: request.id,
        serviceId: service.id,
        serviceTitle: service.title,
        providerId: service.providerId,
        providerName: users.get(service.providerId)!.name,
        producerId: 'usr-1',
        producerName: users.get('usr-1')!.name,
        propertyId: request.propertyId,
        location: `${places.get(request.propertyId)}, Santa Helena - PR`,
        scheduledDate: addDays(today, request.dayOffset),
        quantity: request.quantity,
        priceUnit: service.priceUnit,
        value: roundMoney(service.price * request.quantity),
        notes: request.notes ?? null,
        status: request.status,
        counterDate: request.counter ? addDays(today, request.counter.dayOffset) : null,
        counterValue: request.counter?.value ?? null,
        counterMessage: request.counter?.message ?? null,
        counterCreatedAt: request.counter ? this.daysAgo(2) : null,
        rejectReason: request.rejectReason ?? null,
        cancelReason: systemReason,
        cancelledBy: request.cancelledBy ?? null,
        reviewId: request.id === 'req-4' ? 'rev-1' : null,
        createdAt: this.daysAgo(request.events[0][1]),
        updatedAt: this.daysAgo(lastEvent[1]),
      };
    });
    await manager.insert(ServiceRequest, requests);

    // Linha do tempo de cada solicitação
    const events = SEED_REQUESTS.flatMap((request) => {
      const providerId = services.get(request.serviceId)!.providerId;
      return request.events.map(([type, days, actor, note], index) => {
        const actorId = actor === 'producer' ? 'usr-1' : providerId;
        return {
          id: `${request.id}-evt-${index + 1}`,
          requestId: request.id,
          type,
          actorId,
          actorRole: actor,
          actorName: users.get(actorId)!.name,
          note: note ?? null,
          createdAt: this.daysAgo(days, 12 + index),
        };
      });
    });
    await manager.insert(RequestEvent, events);

    // Avaliação registrada da solicitação concluída com o prestador demo
    const review = {
      id: 'rev-1',
      requestId: 'req-4',
      serviceId: 'svc-5',
      serviceTitle: services.get('svc-5')!.title,
      providerId: 'prv-1',
      producerId: 'usr-1',
      producerName: users.get('usr-1')!.name,
      rating: 5,
      comment: 'Aplicação uniforme e equipe pontual. Recomendo.',
      replyText: 'Obrigado pela confiança, Carlos!',
      replyCreatedAt: this.daysAgo(2),
      replyUpdatedAt: this.daysAgo(2),
      hidden: false,
      editableUntil: new Date(Date.parse(this.daysAgo(3)) + 7 * DAY_MS).toISOString(),
      createdAt: this.daysAgo(3),
      updatedAt: this.daysAgo(3),
    };
    await manager.insert(Review, review);
  }

  private async seedExtras(manager: EntityManager): Promise<void> {
    // Conversa de uma solicitação agendada
    const messages = [
      { id: 'msg-1', requestId: 'req-10', senderId: 'usr-1', senderName: 'Carlos Henrique Souza', senderRole: 'producer' as const, text: 'Bom dia! O mapa de fertilidade já está pronto, posso enviar por aqui?', createdAt: this.daysAgo(3, 14) },
      { id: 'msg-2', requestId: 'req-10', senderId: 'prv-1', senderName: 'Agro Máquinas Paraná', senderRole: 'provider' as const, text: 'Bom dia, Carlos. Pode sim, levamos o equipamento calibrado no dia.', createdAt: this.daysAgo(3, 15) },
    ];
    await manager.insert(Message, messages);

    // Denúncia aberta para a fila do administrador
    const report = {
      id: 'rep-1',
      reporterId: 'usr-1',
      reporterName: 'Carlos Henrique Souza',
      reporterRole: 'producer' as const,
      targetType: 'service' as const,
      targetId: 'svc-12',
      targetLabel: 'Manutenção de Sistemas de Irrigação',
      reason: 'false_info' as const,
      description: 'O anúncio informa atendimento em toda a região, mas o prestador não atende Santa Helena.',
      status: 'open' as const,
      resolution: null,
      createdAt: this.daysAgo(1),
    };
    await manager.insert(Report, report);

    // Notificações iniciais de cada papel
    const notifications = [
      { id: 'ntf-1', userId: 'prv-1', type: 'request_created' as const, title: 'Nova solicitação: Pulverização Agrícola', link: '/prestador/solicitacoes/req-1', read: false, createdAt: this.daysAgo(2) },
      { id: 'ntf-2', userId: 'usr-1', type: 'counter_offer' as const, title: 'Você recebeu uma contraproposta', link: '/solicitacoes/req-9', read: false, createdAt: this.daysAgo(2) },
      { id: 'ntf-3', userId: 'usr-1', type: 'request_status' as const, title: 'Sua solicitação foi agendada', link: '/solicitacoes/req-10', read: true, createdAt: this.daysAgo(3) },
      { id: 'ntf-4', userId: 'adm-1', type: 'report_created' as const, title: 'Nova denúncia: Informação falsa', link: '/admin/denuncias', read: false, createdAt: this.daysAgo(1) },
      { id: 'ntf-5', userId: 'adm-1', type: 'verification_submitted' as const, title: 'Nova verificação de Irriga Sul Tecnologia', link: '/admin/verificacoes', read: false, createdAt: this.daysAgo(3) },
    ];
    await manager.insert(Notification, notifications);

    // Favorito, dia bloqueado e histórico administrativo de exemplo
    const today = this.clock.today();
    await manager.insert(Favorite, { id: 'fav-1', producerId: 'usr-1', serviceId: 'svc-3', createdAt: this.daysAgo(9) });
    await manager.insert(BlockedDay, { id: 'blk-1', providerId: 'prv-1', date: addDays(today, 15) });
    await manager.insert(AdminAction, {
      id: 'act-1',
      adminId: 'adm-1',
      adminName: 'Administração AgroServ',
      action: 'approve_verification' as const,
      targetType: 'verification' as const,
      targetId: 'prv-1',
      targetLabel: 'Agro Máquinas Paraná',
      reason: null,
      createdAt: this.daysAgo(98),
    });
  }
}
