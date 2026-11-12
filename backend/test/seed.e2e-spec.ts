import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { REQUEST_STATUSES } from '../src/types/index.js';
import { ProviderProfile } from '../src/entities/provider-profile.entity.js';
import { ServiceRequest } from '../src/entities/service-request.entity.js';
import { Service } from '../src/entities/service.entity.js';
import { User } from '../src/entities/user.entity.js';

describe('seed', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates the demo accounts with fixed ids', async () => {
    const users = await dataSource.getRepository(User).find();
    expect(users.map((user) => user.id).sort()).toEqual(
      ['adm-1', 'prv-1', 'prv-2', 'prv-3', 'prv-4', 'prv-5', 'prv-6', 'usr-1'].sort(),
    );
    expect(users[0].passwordHash).toBeUndefined();
  });

  it('keeps the 12 services and their relations', async () => {
    const services = await dataSource.getRepository(Service).find({
      relations: { provider: { providerProfile: true }, category: true, equipment: true },
    });
    expect(services).toHaveLength(12);
    const spraying = services.find((service) => service.id === 'svc-1')!;
    expect(spraying.provider?.providerProfile?.verificationStatus).toBe('approved');
    expect(spraying.category?.slug).toBe('pulverizacao');
    expect(spraying.equipment?.map((item) => item.id)).toEqual(['eqp-1']);
  });

  it('has one request in every status between the demo producer and provider', async () => {
    const requests = await dataSource.getRepository(ServiceRequest).findBy({ producerId: 'usr-1', providerId: 'prv-1' });
    expect(new Set(requests.map((request) => request.status))).toEqual(new Set(REQUEST_STATUSES));
  });

  it('seeds the verification statuses from the contract', async () => {
    const profiles = await dataSource.getRepository(ProviderProfile).find();
    const byId = Object.fromEntries(profiles.map((profile) => [profile.userId, profile.verificationStatus]));
    expect(byId).toEqual({
      'prv-1': 'approved', 'prv-2': 'approved', 'prv-3': 'under_review',
      'prv-4': 'not_sent', 'prv-5': 'not_sent', 'prv-6': 'approved',
    });
  });
});
