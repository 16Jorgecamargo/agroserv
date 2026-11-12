import { INestApplication } from '@nestjs/common';
import { addDays, ClockService } from '../src/common/clock.service.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

describe('discovery', () => {
  let app: INestApplication;
  let producer: string;
  let today: string;

  const ids = async (query: string) => {
    const response = await api(app).get(`/services?pageSize=60&${query}`).expect(200);
    return response.body.data.data.map((service: { id: string }) => service.id) as string[];
  };

  beforeAll(async () => {
    app = await createApp();
    producer = await login(app, PRODUCER);
    today = app.get(ClockService).today();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('filters and sorting', () => {
    it('filters by price unit and range only together', async () => {
      expect(await ids('priceUnit=hour')).toEqual(['svc-1', 'svc-7', 'svc-8', 'svc-12']);
      expect(await ids('priceUnit=hour&minPrice=150&maxPrice=200')).toEqual(['svc-1', 'svc-7']);
      expect(await ids('minPrice=1000')).toHaveLength(12);
      expect(await ids('priceUnit=parsec&minPrice=abc')).toHaveLength(12);
    });

    it('filters by rating, verified providers and free date', async () => {
      expect(await ids('minRating=4.9')).toEqual(['svc-1', 'svc-3', 'svc-10']);
      const verified = await ids('verified=true');
      expect(verified).toEqual(['svc-1', 'svc-2', 'svc-3', 'svc-5', 'svc-8', 'svc-9', 'svc-11']);
      const blockedDay = await ids(`date=${addDays(today, 15)}`);
      expect(blockedDay).not.toContain('svc-1');
      expect(blockedDay).not.toContain('svc-5');
      expect(blockedDay).not.toContain('svc-4');
      expect(blockedDay).toContain('svc-2');
      expect(await ids('date=31-12-2026')).toHaveLength(12);
    });

    it('sorts by price and rating', async () => {
      const cheap = await ids('priceUnit=hectare&sort=price_asc');
      expect(cheap).toEqual(['svc-10', 'svc-5', 'svc-11', 'svc-9', 'svc-3', 'svc-2']);
      const expensive = await ids('priceUnit=hectare&sort=price_desc');
      expect(expensive).toEqual([...cheap].reverse());
      const best = await ids('sort=rating');
      expect(best.slice(0, 3)).toEqual(['svc-1', 'svc-3', 'svc-10']);
      expect(await ids('sort=random')).toEqual(await ids('sort=relevance'));
    });
  });

  describe('favorites', () => {
    it('adds, lists newest first and removes idempotently', async () => {
      const added = await api(app, producer).post('/me/favorites', { serviceId: 'svc-7' }).expect(200);
      expect(added.body).toMatchObject({ success: true, data: { id: 'svc-7' } });
      await api(app, producer).post('/me/favorites', { serviceId: 'svc-7' }).expect(200);
      const list = await api(app, producer).get('/me/favorites').expect(200);
      expect(list.body.data.map((service: { id: string }) => service.id)).toEqual(['svc-7', 'svc-3']);
      const missing = await api(app, producer).post('/me/favorites', { serviceId: 'nope' }).expect(404);
      expect(missing.body.error.code).toBe('service_not_found');
      await api(app, producer).delete('/me/favorites/svc-7').expect(204);
      await api(app, producer).delete('/me/favorites/svc-7').expect(204);
      await api(app, await login(app, PROVIDER)).get('/me/favorites').expect(403);
    });

    it('hides favorites that left the catalog', async () => {
      const owner = await login(app, 'prestador6@agroserv.com');
      await api(app, owner).post('/provider/services/svc-3/pause').expect(200);
      const list = await api(app, producer).get('/me/favorites').expect(200);
      expect(list.body.data).toEqual([]);
      await api(app, owner).post('/provider/services/svc-3/activate').expect(200);
    });
  });

  describe('public provider profile', () => {
    it('shows the provider with services, equipment and reviews', async () => {
      const response = await api(app).get('/providers/prv-1').expect(200);
      const { provider, services, equipment, recentReviews, reviewSummary } = response.body.data;
      expect(provider).toMatchObject({
        id: 'prv-1', name: 'Agro Máquinas Paraná', verified: true, serviceRadiusKm: 80, yearsOfExperience: 12, rating: 4.9,
      });
      expect(provider).not.toHaveProperty('document');
      expect(provider).not.toHaveProperty('email');
      expect(services.map((service: { id: string }) => service.id).sort()).toEqual(['svc-1', 'svc-5']);
      expect(equipment).toHaveLength(2);
      expect(recentReviews.map((review: { id: string }) => review.id)).toEqual(['rev-1']);
      expect(reviewSummary).toMatchObject({ average: 4.9, count: 186, writtenCount: 1 });
    });

    it('answers provider_unavailable for non providers and suspended accounts', async () => {
      const notProvider = await api(app).get('/providers/usr-1').expect(404);
      expect(notProvider.body.error).toMatchObject({
        code: 'provider_unavailable', message: 'Prestador não está mais na plataforma.',
      });
      await api(app).get('/providers/nope').expect(404);
      const admin = await login(app, ADMIN);
      await api(app, admin).post('/admin/users/prv-5/suspend', { reason: 'Conta em análise.' }).expect(200);
      await api(app).get('/providers/prv-5').expect(404);
    });
  });
});
