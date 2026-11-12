import { INestApplication } from '@nestjs/common';
import { addDays, ClockService } from '../src/services/clock.service.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Route = [Method, string];

const PRODUCER_ROUTES: Route[] = [
  ['get', '/me/properties'], ['post', '/me/properties'], ['patch', '/me/properties/prop-1'], ['delete', '/me/properties/prop-1'],
  ['post', '/requests'], ['get', '/requests'], ['get', '/requests/req-1'], ['post', '/requests/req-1/cancel'],
  ['post', '/requests/req-9/counter-offer/accept'], ['post', '/requests/req-9/counter-offer/decline'],
  ['post', '/requests/req-5/review'], ['patch', '/reviews/rev-1'], ['get', '/dashboard'],
  ['get', '/me/favorites'], ['post', '/me/favorites'], ['delete', '/me/favorites/svc-3'],
];

const PROVIDER_ROUTES: Route[] = [
  ['get', '/provider/profile'], ['patch', '/provider/profile'], ['get', '/provider/dashboard'],
  ['get', '/provider/services'], ['get', '/provider/services/svc-1'], ['post', '/provider/services'],
  ['patch', '/provider/services/svc-1'], ['post', '/provider/services/svc-1/pause'],
  ['post', '/provider/services/svc-1/activate'], ['delete', '/provider/services/svc-1'],
  ['get', '/provider/requests'], ['get', '/provider/requests/req-1'], ['post', '/provider/requests/req-1/accept'],
  ['post', '/provider/requests/req-1/reject'], ['post', '/provider/requests/req-1/counter-offer'],
  ['post', '/provider/requests/req-10/start'], ['post', '/provider/requests/req-11/complete'],
  ['post', '/provider/requests/req-10/cancel'], ['get', '/provider/equipment'], ['post', '/provider/equipment'],
  ['patch', '/provider/equipment/eqp-1'], ['delete', '/provider/equipment/eqp-1'], ['get', '/provider/agenda'],
  ['post', '/provider/blocked-days'], ['delete', '/provider/blocked-days/2030-01-01'], ['get', '/provider/reviews'],
  ['put', '/provider/reviews/rev-1/reply'], ['get', '/provider/verification'], ['post', '/provider/verification'],
];

const ADMIN_ROUTES: Route[] = [
  ['get', '/admin/dashboard'], ['get', '/admin/users'], ['post', '/admin/users'], ['get', '/admin/users/usr-1'],
  ['get', '/admin/requests/req-1'], ['post', '/admin/users/usr-1/suspend'], ['post', '/admin/users/usr-1/reactivate'],
  ['get', '/admin/verifications'], ['post', '/admin/verifications/prv-3/approve'],
  ['post', '/admin/verifications/prv-3/reject'], ['get', '/admin/services'], ['post', '/admin/services/svc-1/hide'],
  ['post', '/admin/services/svc-1/show'], ['delete', '/admin/services/svc-1'], ['get', '/admin/reports'],
  ['get', '/admin/reports/rep-1'], ['post', '/admin/reports/rep-1/resolve'], ['get', '/admin/categories'],
  ['post', '/admin/categories'], ['patch', '/admin/categories/cat-planting'], ['delete', '/admin/categories/cat-planting'],
  ['get', '/admin/actions'],
];

const SHARED_ROUTES: Route[] = [
  ['get', '/auth/me'], ['patch', '/me'], ['patch', '/me/password'], ['delete', '/me'], ['post', '/uploads'],
  ['get', '/me/notifications'], ['post', '/me/notifications/ntf-1/read'], ['post', '/me/notifications/read-all'],
  ['get', '/requests/req-1/messages'], ['post', '/requests/req-1/messages'], ['post', '/reports'],
];

const PUBLIC_ROUTES = [
  '/health', '/categories', '/services', '/services/featured', '/services/svc-1', '/services/svc-1/reviews',
  '/services/svc-1/blocked-days', '/providers/prv-1',
];

describe('permission sweep and cross-cutting rules', () => {
  let app: INestApplication;
  let tokens: Record<'producer' | 'provider' | 'admin', string>;

  beforeAll(async () => {
    app = await createApp();
    tokens = {
      producer: await login(app, PRODUCER),
      provider: await login(app, PROVIDER),
      admin: await login(app, ADMIN),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 401 without a token on every private route', async () => {
    const routes = [...PRODUCER_ROUTES, ...PROVIDER_ROUTES, ...ADMIN_ROUTES, ...SHARED_ROUTES];
    for (const [method, path] of routes) {
      const response = await api(app)[method](path);
      expect([method, path, response.status]).toEqual([method, path, 401]);
      expect(response.body).toEqual({
        success: false,
        error: { status: 401, code: 'unauthorized', message: 'Sessão inválida. Faça login novamente.' },
      });
    }
  });

  it('answers 403 when the role does not own the route group', async () => {
    const matrix: [Route[], ('producer' | 'provider' | 'admin')[]][] = [
      [PRODUCER_ROUTES, ['provider', 'admin']],
      [PROVIDER_ROUTES, ['producer', 'admin']],
      [ADMIN_ROUTES, ['producer', 'provider']],
    ];
    for (const [routes, roles] of matrix) {
      for (const role of roles) {
        for (const [method, path] of routes) {
          const response = await api(app, tokens[role])[method](path);
          expect([role, method, path, response.status]).toEqual([role, method, path, 403]);
          expect(response.body.error.code).toBe('forbidden');
        }
      }
    }
  });

  it('serves the public catalog without a token and ignores a bad one', async () => {
    for (const path of PUBLIC_ROUTES) {
      await api(app).get(path).expect(200);
      await api(app, 'expired-or-invalid').get(path).expect(200);
    }
  });

  it('wraps every kind of answer in the same envelope', async () => {
    const ok = await api(app).get('/categories').expect(200);
    expect(Object.keys(ok.body)).toEqual(['success', 'data']);
    const invalid = await api(app).post('/auth/register', {}).expect(422);
    expect(Object.keys(invalid.body)).toEqual(['success', 'error']);
    expect(Object.keys(invalid.body.error)).toEqual(['status', 'code', 'message', 'fields']);
    const empty = await api(app, tokens.producer).post('/me/notifications/read-all').expect(204);
    expect(empty.text).toBe('');
    const malformed = await api(app).post('/auth/login').set('Content-Type', 'application/json').send('{"email":').expect(400);
    expect(malformed.body.success).toBe(false);
  });

  it('uses the Brasilia day for "today" between 21h and midnight', async () => {
    const clock = app.get(ClockService);
    const utcDay = new Date().toISOString().slice(0, 10);
    const nextUtcDay = addDays(utcDay, 1);
    vi.spyOn(clock, 'now').mockReturnValue(new Date(`${nextUtcDay}T01:30:00Z`));
    expect(clock.today()).toBe(utcDay);
    const body = { serviceId: 'svc-3', propertyId: 'prop-1', quantity: 1 };
    const sameDay = await api(app, tokens.producer).post('/requests', { ...body, scheduledDate: utcDay }).expect(201);
    expect(sameDay.body.data.scheduledDate).toBe(utcDay);
    const yesterday = await api(app, tokens.producer).post('/requests', { ...body, scheduledDate: addDays(utcDay, -1) }).expect(422);
    expect(yesterday.body.error.fields).toEqual({ scheduledDate: 'Escolha uma data a partir de hoje.' });
    const blocked = await api(app, tokens.provider).post('/provider/blocked-days', { date: utcDay }).expect(201);
    expect(blocked.body.data.date).toBe(utcDay);
  });

  it('keeps old requests and reviews opening after soft deletes', async () => {
    const owner = await login(app, 'prestador5@agroserv.com');
    await api(app, owner).delete('/provider/services/svc-7').expect(204);
    const removedService = await api(app, tokens.producer).get('/requests/req-6').expect(200);
    expect(removedService.body.data).toMatchObject({ serviceRemoved: true, serviceTitle: 'Manutenção de Colheitadeiras' });
    expect(removedService.body.data.service.id).toBe('svc-7');
    const created = await api(app, tokens.producer).post('/me/properties', {
      name: 'Lote Temporário', city: 'Toledo', state: 'PR', areaHectares: 5,
    }).expect(201);
    const request = await api(app, tokens.producer).post('/requests', {
      serviceId: 'svc-3', propertyId: created.body.data.id, scheduledDate: addDays(app.get(ClockService).today(), 9), quantity: 1,
    }).expect(201);
    await api(app, tokens.producer).post(`/requests/${request.body.data.id}/cancel`).expect(200);
    await api(app, tokens.producer).delete(`/me/properties/${created.body.data.id}`).expect(204);
    const removedProperty = await api(app, tokens.producer).get(`/requests/${request.body.data.id}`).expect(200);
    expect(removedProperty.body.data).toMatchObject({ propertyRemoved: true, location: 'Lote Temporário, Toledo - PR' });
    expect(removedProperty.body.data.property.name).toBe('Lote Temporário');
    const list = await api(app, tokens.producer).get('/me/properties').expect(200);
    expect(list.body.data.map((property: { id: string }) => property.id)).not.toContain(created.body.data.id);
    const admin = await api(app, tokens.admin).get('/admin/users/prv-5').expect(200);
    expect(admin.body.data.services).toEqual([]);
  });
});
