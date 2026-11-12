import { INestApplication } from '@nestjs/common';
import { addDays, ClockService } from '../src/services/clock.service.js';
import { NotificationsRepository } from '../src/repositories/notifications.repository.js';
import { api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

const newService = {
  title: 'Dessecação de Lavoura',
  categoryId: 'cat-spraying',
  description: 'Aplicação de dessecante com barra de 30 metros e controle de deriva.',
  price: 60,
  priceUnit: 'hectare',
  city: 'Santa Helena',
  state: 'PR',
  equipmentIds: ['eqp-1'],
};

describe('provider area', () => {
  let app: INestApplication;
  let provider: string;
  let producer: string;
  let today: string;

  beforeAll(async () => {
    app = await createApp();
    provider = await login(app, PROVIDER);
    producer = await login(app, PRODUCER);
    today = app.get(ClockService).today();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('services', () => {
    let serviceId: string;

    it('validates and publishes a service straight into the search', async () => {
      const invalid = await api(app, provider).post('/provider/services', {
        ...newService, title: 'ab', description: 'curta', price: 0, priceUnit: 'km', categoryId: 'nope',
      }).expect(422);
      expect(invalid.body.error.fields).toEqual({
        title: 'Informe o título.', description: 'Descreva o serviço com pelo menos 20 caracteres.',
        price: 'Informe o preço.', priceUnit: 'Selecione a unidade.',
      });
      const category = await api(app, provider).post('/provider/services', { ...newService, categoryId: 'nope' }).expect(422);
      expect(category.body.error.fields).toEqual({ categoryId: 'Selecione uma categoria.' });
      const equipment = await api(app, provider).post('/provider/services', { ...newService, equipmentIds: ['nope'] }).expect(422);
      expect(equipment.body.error.fields).toEqual({ equipmentIds: 'Equipamento inválido.' });
      const created = await api(app, provider).post('/provider/services', newService).expect(201);
      serviceId = created.body.data.id;
      expect(created.body.data).toMatchObject({
        status: 'active', available: true, providerId: 'prv-1', providerVerified: true, equipmentIds: ['eqp-1'], rating: 0, reviewCount: 0,
      });
      const search = await api(app).get('/services?q=dessecacao').expect(200);
      expect(search.body.data.data.map((service: { id: string }) => service.id)).toEqual([serviceId]);
    });

    it('lists own services newest first and edits them', async () => {
      const list = await api(app, provider).get('/provider/services').expect(200);
      expect(list.body.data.map((service: { id: string }) => service.id)).toEqual([serviceId, 'svc-5', 'svc-1']);
      const edited = await api(app, provider).patch(`/provider/services/${serviceId}`, { price: 75.5, equipmentIds: [] }).expect(200);
      expect(edited.body.data).toMatchObject({ price: 75.5, equipmentIds: [], title: 'Dessecação de Lavoura' });
      const detail = await api(app, provider).get(`/provider/services/${serviceId}`).expect(200);
      expect(detail.body.data.category.id).toBe('cat-spraying');
      await api(app, provider).get('/provider/services/svc-2').expect(404);
      await api(app, producer).get('/provider/services').expect(403);
    });

    it('pauses and reactivates following the visibility rule', async () => {
      const paused = await api(app, provider).post(`/provider/services/${serviceId}/pause`).expect(200);
      expect(paused.body.data.status).toBe('paused');
      await api(app).get(`/services/${serviceId}`).expect(404);
      await api(app, provider).get(`/services/${serviceId}`).expect(200);
      const again = await api(app, provider).post(`/provider/services/${serviceId}/pause`).expect(409);
      expect(again.body.error.code).toBe('invalid_transition');
      await api(app, provider).post(`/provider/services/${serviceId}/activate`).expect(200);
      await api(app).get(`/services/${serviceId}`).expect(200);
      await api(app, provider).post(`/provider/services/${serviceId}/activate`).expect(409);
    });

    it('soft deletes a service unless it has open requests', async () => {
      const blocked = await api(app, provider).delete('/provider/services/svc-1').expect(409);
      expect(blocked.body.error.message).toBe('Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.');
      await api(app, provider).delete(`/provider/services/${serviceId}`).expect(204);
      await api(app, provider).get(`/provider/services/${serviceId}`).expect(404);
      await api(app).get(`/services/${serviceId}`).expect(404);
    });
  });

  describe('requests', () => {
    const create = async (overrides: object = {}) => {
      const response = await api(app, producer).post('/requests', {
        serviceId: 'svc-5', propertyId: 'prop-1', scheduledDate: addDays(today, 5), quantity: 10, ...overrides,
      }).expect(201);
      return response.body.data.id as string;
    };

    it('lists received requests newest first with status filter', async () => {
      const response = await api(app, provider).get('/provider/requests').expect(200);
      const created = response.body.data.map((request: { createdAt: string }) => request.createdAt);
      expect(created).toEqual([...created].sort((a: string, b: string) => b.localeCompare(a)));
      expect(response.body.data.every((request: { providerId: string }) => request.providerId === 'prv-1')).toBe(true);
      const pending = await api(app, provider).get('/provider/requests?status=pending').expect(200);
      expect(pending.body.data.map((request: { id: string }) => request.id)).toEqual(['req-1']);
      await api(app, provider).get('/provider/requests?status=nope').expect(400);
    });

    it('shows the property and hides the producer phone until scheduled', async () => {
      const pending = await api(app, provider).get('/provider/requests/req-1').expect(200);
      expect(pending.body.data.property).toMatchObject({ areaHectares: 120, crops: ['Soja', 'Milho'] });
      expect(pending.body.data.producer).not.toHaveProperty('phone');
      expect(pending.body.data.allowedActions).toEqual(['accept', 'reject', 'counter_offer', 'message', 'report']);
      const accepted = await api(app, provider).get('/provider/requests/req-10').expect(200);
      expect(accepted.body.data.producer.phone).toBe('45999110001');
      await api(app, provider).get('/provider/requests/req-2').expect(404);
    });

    it('runs the whole happy path: accept, start, complete', async () => {
      const id = await create({ scheduledDate: today });
      const accepted = await api(app, provider).post(`/provider/requests/${id}/accept`).expect(200);
      expect(accepted.body.data).toMatchObject({ status: 'accepted', allowedActions: ['start', 'cancel', 'message', 'report'] });
      const started = await api(app, provider).post(`/provider/requests/${id}/start`).expect(200);
      expect(started.body.data.status).toBe('in_progress');
      await api(app, provider).post(`/provider/requests/${id}/cancel`, { reason: 'Não consigo terminar.' }).expect(409);
      const completed = await api(app, provider).post(`/provider/requests/${id}/complete`).expect(200);
      expect(completed.body.data.status).toBe('completed');
      expect(completed.body.data.events.map((event: { type: string }) => event.type)).toEqual(['created', 'accepted', 'started', 'completed']);
      const producerView = await api(app, producer).get(`/requests/${id}`).expect(200);
      expect(producerView.body.data.allowedActions).toEqual(['review', 'report']);
      const [notifications] = await app.get(NotificationsRepository).findPage('usr-1', false, { page: 1, pageSize: 3, skip: 0 });
      expect(notifications.map((notification) => notification.title)).toContain('Serviço concluído. Conte como foi.');
    });

    it('only starts from the scheduled date and rejects with a reason', async () => {
      const id = await create();
      await api(app, provider).post(`/provider/requests/${id}/accept`).expect(200);
      const early = await api(app, provider).post(`/provider/requests/${id}/start`).expect(409);
      expect(early.body.error.message).toBe('O serviço só pode ser iniciado a partir da data agendada.');
      const noReason = await api(app, provider).post(`/provider/requests/${id}/cancel`, {}).expect(422);
      expect(noReason.body.error.fields).toEqual({ reason: 'Informe o motivo do cancelamento.' });
      const cancelled = await api(app, provider).post(`/provider/requests/${id}/cancel`, { reason: 'Máquina quebrou.' }).expect(200);
      expect(cancelled.body.data).toMatchObject({ status: 'cancelled', cancelledBy: 'provider', cancelReason: 'Máquina quebrou.' });
      const other = await create();
      const missing = await api(app, provider).post(`/provider/requests/${other}/reject`, { reason: 'não' }).expect(422);
      expect(missing.body.error.fields).toEqual({ reason: 'Informe o motivo da recusa.' });
      const rejected = await api(app, provider).post(`/provider/requests/${other}/reject`, { reason: 'Agenda cheia.' }).expect(200);
      expect(rejected.body.data).toMatchObject({ status: 'rejected', rejectReason: 'Agenda cheia.' });
      await api(app, provider).post(`/provider/requests/${other}/accept`).expect(409);
    });

    it('validates and sends a counter offer the producer can decline', async () => {
      const id = await create();
      const empty = await api(app, provider).post(`/provider/requests/${id}/counter-offer`, { message: 'Posso em outra data.' }).expect(422);
      expect(empty.body.error.fields).toEqual({ date: 'Proponha uma nova data ou um novo valor.' });
      const same = await api(app, provider).post(`/provider/requests/${id}/counter-offer`, {
        message: 'Posso em outra data.', date: addDays(today, 5), value: 950,
      }).expect(422);
      expect(same.body.error.fields).toEqual({ date: 'Proponha uma nova data ou um novo valor.' });
      const invalid = await api(app, provider).post(`/provider/requests/${id}/counter-offer`, {
        message: 'oi', date: addDays(today, -2), value: -1,
      }).expect(422);
      expect(invalid.body.error.fields).toEqual({ value: 'Informe um valor válido.', message: 'Explique a proposta ao produtor.' });
      const past = await api(app, provider).post(`/provider/requests/${id}/counter-offer`, {
        message: 'Posso em outra data.', date: addDays(today, -2),
      }).expect(422);
      expect(past.body.error.fields).toEqual({ date: 'Escolha uma data a partir de hoje.' });
      const sent = await api(app, provider).post(`/provider/requests/${id}/counter-offer`, { message: 'Consigo por um valor menor.', value: 900 }).expect(200);
      expect(sent.body.data).toMatchObject({ status: 'counter_offer', value: 950, allowedActions: ['message', 'report'] });
      expect(sent.body.data.counterOffer).toMatchObject({ value: 900, message: 'Consigo por um valor menor.' });
      expect(sent.body.data.counterOffer).not.toHaveProperty('date');
      await api(app, provider).post(`/provider/requests/${id}/counter-offer`, { message: 'Outra proposta.', value: 800 }).expect(409);
      const declined = await api(app, producer).post(`/requests/${id}/counter-offer/decline`).expect(200);
      expect(declined.body.data).toMatchObject({
        status: 'cancelled', cancelledBy: 'producer', cancelReason: 'Contraproposta recusada pelo produtor',
      });
    });

    it('does not accept a request whose date already passed', async () => {
      const id = await create({ scheduledDate: addDays(today, 1) });
      vi.spyOn(app.get(ClockService), 'now').mockReturnValue(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
      const detail = await api(app, provider).get(`/provider/requests/${id}`).expect(200);
      expect(detail.body.data.allowedActions).toEqual(['reject', 'counter_offer', 'message', 'report']);
      const late = await api(app, provider).post(`/provider/requests/${id}/accept`).expect(409);
      expect(late.body.error.message).toBe('A data pedida já passou. Faça uma contraproposta com uma nova data.');
    });

    it('builds the dashboard from requests, events and profile', async () => {
      const response = await api(app, provider).get('/provider/dashboard').expect(200);
      const { stats, pendingRequests, upcomingRequests } = response.body.data;
      expect(stats.averageRating).toBe(4.9);
      expect(stats.newRequests).toBe(pendingRequests.length);
      expect(stats.inProgress).toBe(1);
      expect(stats.acceptanceRate).toBeGreaterThan(0);
      expect(stats.acceptanceRate).toBeLessThanOrEqual(1);
      expect(stats.monthEstimatedValue).toBeGreaterThanOrEqual(950);
      expect(upcomingRequests.every((request: { status: string }) => request.status === 'accepted')).toBe(true);
      const empty = await api(app, await login(app, 'prestador5@agroserv.com')).get('/provider/dashboard').expect(200);
      expect(empty.body.data.stats.acceptanceRate).toBeNull();
    });
  });
});
