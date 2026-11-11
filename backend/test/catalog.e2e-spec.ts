import { INestApplication } from '@nestjs/common';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

describe('public catalog', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists active categories in registration order', async () => {
    const response = await api(app).get('/categories').expect(200);
    expect(response.body.data).toHaveLength(8);
    expect(response.body.data[0]).toEqual({ id: 'cat-planting', slug: 'plantio', name: 'Plantio', icon: 'sprout', active: true });
  });

  it('paginates services with the contract defaults', async () => {
    const response = await api(app).get('/services').expect(200);
    expect(response.body.data.meta).toEqual({ page: 1, pageSize: 9, total: 12, totalPages: 2 });
    expect(response.body.data.data[0]).toMatchObject({
      id: 'svc-1', providerName: 'Agro Máquinas Paraná', providerVerified: true, status: 'active',
      rating: 4.9, reviewCount: 128, equipmentIds: ['eqp-1'], photos: [], imageUrl: '',
    });
    const invalid = await api(app).get('/services?page=abc&pageSize=999').expect(200);
    expect(invalid.body.data.meta).toMatchObject({ page: 1, pageSize: 60 });
  });

  it('searches ignoring accents, case and punctuation', async () => {
    const byText = await api(app).get('/services?q=PULVERIZACAO drone').expect(200);
    expect(byText.body.data.data.map((service: { id: string }) => service.id)).toEqual(['svc-10']);
    const byProvider = await api(app).get('/services?q=semear').expect(200);
    expect(byProvider.body.data.meta.total).toBe(3);
    const byPlace = await api(app).get('/services?location=Santa Helena, PR').expect(200);
    expect(byPlace.body.data.data.map((service: { id: string }) => service.id)).toEqual(['svc-1', 'svc-5']);
    const byCategory = await api(app).get('/services?category=manutencao').expect(200);
    expect(byCategory.body.data.meta.total).toBe(2);
    const unknown = await api(app).get('/services?category=nao-existe').expect(200);
    expect(unknown.body.data.meta.total).toBe(0);
  });

  it('returns featured services that are available, best rated first', async () => {
    const response = await api(app).get('/services/featured').expect(200);
    expect(response.body.data.map((service: { id: string }) => service.id)).toEqual(['svc-1', 'svc-3', 'svc-10', 'svc-2']);
    const limited = await api(app).get('/services/featured?limit=50').expect(200);
    expect(limited.body.data).toHaveLength(10);
  });

  it('returns the service detail with provider, category and equipment', async () => {
    const response = await api(app).get('/services/svc-1').expect(200);
    expect(response.body.data.provider).toMatchObject({ id: 'prv-1', verified: true, serviceRadiusKm: 80 });
    expect(response.body.data.provider).not.toHaveProperty('document');
    expect(response.body.data.category.slug).toBe('pulverizacao');
    expect(response.body.data.equipment[0]).toMatchObject({ id: 'eqp-1', type: 'sprayer' });
    const missing = await api(app).get('/services/nope').expect(404);
    expect(missing.body.error.code).toBe('service_not_found');
  });

  it('hides services of deleted providers but keeps them for admins', async () => {
    const provider = await login(app, 'prestador4@agroserv.com');
    await api(app, provider).delete('/me').expect(200);
    await api(app).get('/services/svc-6').expect(404);
    const list = await api(app).get('/services?pageSize=60').expect(200);
    expect(list.body.data.meta.total).toBe(11);
    const admin = await api(app, await login(app, ADMIN)).get('/services/svc-6').expect(200);
    expect(admin.body.data).toMatchObject({ status: 'hidden', hiddenReason: 'Conta excluída' });
    await api(app, await login(app, PRODUCER)).get('/services/svc-6').expect(404);
  });

  it('keeps the search text in sync with the provider name', async () => {
    const provider = await login(app, PROVIDER);
    await api(app, provider).patch('/me', { name: 'Terra Boa Agrícola' }).expect(200);
    const response = await api(app).get('/services?q=terra boa').expect(200);
    expect(response.body.data.meta.total).toBe(2);
  });
});
