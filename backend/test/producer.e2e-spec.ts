import { INestApplication } from '@nestjs/common';
import { addDays, ClockService } from '../src/services/clock.service.js';
import { api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

describe('producer journey', () => {
  let app: INestApplication;
  let producer: string;
  let today: string;

  beforeAll(async () => {
    app = await createApp();
    producer = await login(app, PRODUCER);
    today = app.get(ClockService).today();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('properties', () => {
    it('lists, creates, edits and validates properties', async () => {
      const list = await api(app, producer).get('/me/properties').expect(200);
      expect(list.body.data.map((property: { id: string }) => property.id)).toEqual(['prop-1', 'prop-2']);
      const invalid = await api(app, producer).post('/me/properties', {
        name: 'A', city: 'Toledo', state: 'PR', areaHectares: 0, crops: ['Soja', 'soja'],
      }).expect(422);
      expect(invalid.body.error.fields).toEqual({
        name: 'Informe o nome da propriedade.', crops: 'Informe até 10 culturas.',
      });
      const zero = await api(app, producer).post('/me/properties', { name: 'Chácara', city: 'Toledo', state: 'PR', areaHectares: 0 }).expect(422);
      expect(zero.body.error.fields).toEqual({ areaHectares: 'Informe a área em hectares.' });
      const created = await api(app, producer).post('/me/properties', {
        name: ' Chácara Sol ', city: 'Toledo', state: 'PR', areaHectares: 12.5, crops: ['Soja'],
      }).expect(201);
      expect(created.body.data).toMatchObject({ name: 'Chácara Sol', accessNotes: '', crops: ['Soja'] });
      const edited = await api(app, producer).patch(`/me/properties/${created.body.data.id}`, { areaHectares: 20 }).expect(200);
      expect(edited.body.data).toMatchObject({ name: 'Chácara Sol', areaHectares: 20 });
      await api(app, producer).delete(`/me/properties/${created.body.data.id}`).expect(204);
      await api(app, producer).patch(`/me/properties/${created.body.data.id}`, { areaHectares: 5 }).expect(404);
    });

    it('blocks removing a property with open requests and forbids other roles', async () => {
      const blocked = await api(app, producer).delete('/me/properties/prop-1').expect(409);
      expect(blocked.body.error.message).toBe('Esta propriedade tem solicitações em aberto.');
      await api(app, await login(app, PROVIDER)).get('/me/properties').expect(403);
    });
  });

  describe('requests', () => {
    const body = (overrides: object = {}) => ({
      serviceId: 'svc-3', propertyId: 'prop-1', scheduledDate: addDays(today, 4), quantity: 2.5, notes: 'Entrada pela porteira verde.', ...overrides,
    });

    it('creates a pending request with copies, value and the created event', async () => {
      const response = await api(app, producer).post('/requests', body()).expect(201);
      expect(response.body.data).toMatchObject({
        status: 'pending', serviceTitle: 'Plantio Direto de Precisão', providerName: 'Semear Agrícola',
        producerName: 'Carlos Henrique Souza', location: 'Fazenda Boa Vista, Santa Helena - PR',
        value: 525, priceUnit: 'hectare', quantity: 2.5, serviceRemoved: false, propertyRemoved: false,
        allowedActions: ['cancel', 'message', 'report'],
      });
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0]).toMatchObject({ type: 'created', actorRole: 'producer' });
      expect(response.body.data.provider).not.toHaveProperty('phone');
      expect(response.body.data.property.areaHectares).toBe(120);
    });

    it('validates service, property, date, blocked days and availability', async () => {
      const missing = await api(app, producer).post('/requests', body({ serviceId: 'nope' })).expect(404);
      expect(missing.body.error.code).toBe('service_not_found');
      const property = await api(app, producer).post('/requests', body({ propertyId: 'nope' })).expect(422);
      expect(property.body.error.fields).toEqual({ propertyId: 'Selecione uma propriedade.' });
      const past = await api(app, producer).post('/requests', body({ scheduledDate: addDays(today, -1) })).expect(422);
      expect(past.body.error.fields).toEqual({ scheduledDate: 'Escolha uma data a partir de hoje.' });
      const blocked = await api(app, producer).post('/requests', body({ serviceId: 'svc-1', scheduledDate: addDays(today, 15) })).expect(422);
      expect(blocked.body.error.fields).toEqual({ scheduledDate: 'O prestador não atende nesta data.' });
      const quantity = await api(app, producer).post('/requests', body({ quantity: 0 })).expect(422);
      expect(quantity.body.error.fields).toEqual({ quantity: 'Informe a quantidade.' });
      const unavailable = await api(app, producer).post('/requests', body({ serviceId: 'svc-11' })).expect(409);
      expect(unavailable.body.error).toMatchObject({
        code: 'service_unavailable', message: 'Este serviço não está disponível para novas solicitações.',
      });
    });

    it('lists requests by date and filters by status', async () => {
      const all = await api(app, producer).get('/requests?status=all').expect(200);
      const dates = all.body.data.map((request: { scheduledDate: string }) => request.scheduledDate);
      expect(dates).toEqual([...dates].sort((a: string, b: string) => b.localeCompare(a)));
      const counter = await api(app, producer).get('/requests?status=counter_offer').expect(200);
      expect(counter.body.data.map((request: { id: string }) => request.id)).toEqual(['req-9']);
      const invalid = await api(app, producer).get('/requests?status=nope').expect(400);
      expect(invalid.body.error.code).toBe('invalid_status');
    });

    it('shows the detail with timeline and phone only after scheduling', async () => {
      const accepted = await api(app, producer).get('/requests/req-10').expect(200);
      expect(accepted.body.data.provider.phone).toBe('45999220001');
      expect(accepted.body.data.events.map((event: { type: string }) => event.type)).toEqual(['created', 'accepted']);
      const pending = await api(app, producer).get('/requests/req-1').expect(200);
      expect(pending.body.data.provider).not.toHaveProperty('phone');
      const counter = await api(app, producer).get('/requests/req-9').expect(200);
      expect(counter.body.data.counterOffer).toMatchObject({ date: addDays(today, 8), value: 1000 });
      const missing = await api(app, producer).get('/requests/nope').expect(404);
      expect(missing.body.error.code).toBe('request_not_found');
      await api(app, await login(app, PROVIDER)).get('/requests/req-1').expect(403);
    });

    it('accepts a counter offer applying the proposed date and value', async () => {
      const response = await api(app, producer).post('/requests/req-9/counter-offer/accept').expect(200);
      expect(response.body.data).toMatchObject({ status: 'accepted', scheduledDate: addDays(today, 8), value: 1000 });
      expect(response.body.data.counterOffer.value).toBe(1000);
      const event = response.body.data.events.at(-1);
      expect(event).toMatchObject({ type: 'counter_offer_accepted', previousDate: addDays(today, 5), previousValue: 1080 });
      const again = await api(app, producer).post('/requests/req-9/counter-offer/accept').expect(409);
      expect(again.body.error).toMatchObject({
        code: 'invalid_transition', message: 'Esta ação não está mais disponível para esta solicitação.',
      });
    });

    it('requires a reason to cancel a scheduled request', async () => {
      const missing = await api(app, producer).post('/requests/req-10/cancel', {}).expect(422);
      expect(missing.body.error.fields).toEqual({ reason: 'Informe o motivo do cancelamento.' });
      const done = await api(app, producer).post('/requests/req-10/cancel', { reason: 'Choveu demais na semana.' }).expect(200);
      expect(done.body.data).toMatchObject({ status: 'cancelled', cancelledBy: 'producer', cancelReason: 'Choveu demais na semana.' });
      expect(done.body.data.allowedActions).toEqual(['report']);
      await api(app, producer).post('/requests/req-1/cancel').expect(200);
      await api(app, producer).post('/requests/req-11/cancel', { reason: 'Não quero mais.' }).expect(409);
    });

    it('declines a counter offer closing the request', async () => {
      const created = await api(app, producer).post('/requests', body()).expect(201);
      await api(app, producer).post(`/requests/${created.body.data.id}/counter-offer/decline`).expect(409);
    });

    it('notifies the provider about new and cancelled requests', async () => {
      const { NotificationsRepository } = await import('../src/repositories/notifications.repository.js');
      const [notifications] = await app.get(NotificationsRepository).findPage('prv-1', false, { page: 1, pageSize: 50, skip: 0 });
      const titles = notifications.map((notification) => notification.title);
      expect(titles).toContain('Contraproposta aceita');
      expect(titles).toContain('Solicitação cancelada pelo produtor');
      const cancelled = notifications.find((notification) => notification.title === 'Solicitação cancelada pelo produtor')!;
      expect(cancelled.link).toMatch(/^\/prestador\/solicitacoes\/req-/);
    });

    it('computes the dashboard totals', async () => {
      const response = await api(app, producer).get('/dashboard').expect(200);
      const list = await api(app, producer).get('/requests').expect(200);
      const requests = list.body.data as { status: string; value: number }[];
      const count = (...statuses: string[]) => requests.filter((request) => statuses.includes(request.status)).length;
      expect(response.body.data.stats).toMatchObject({
        open: count('pending', 'counter_offer', 'accepted'),
        inProgress: count('in_progress'),
        completed: count('completed'),
      });
      const spent = requests.filter((request) => ['accepted', 'in_progress', 'completed'].includes(request.status));
      expect(response.body.data.stats.totalSpent).toBe(spent.reduce((sum, request) => sum + request.value, 0));
      expect(response.body.data.recentRequests).toHaveLength(5);
    });
  });
});
