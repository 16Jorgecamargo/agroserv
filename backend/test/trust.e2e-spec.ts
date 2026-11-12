import { INestApplication } from '@nestjs/common';
import { ClockService } from '../src/services/clock.service.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

describe('trust and communication', () => {
  let app: INestApplication;
  let producer: string;
  let provider: string;

  beforeAll(async () => {
    app = await createApp();
    producer = await login(app, PRODUCER);
    provider = await login(app, PROVIDER);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('notifications', () => {
    it('lists newest first with the unread counter', async () => {
      const response = await api(app, producer).get('/me/notifications?pageSize=10').expect(200);
      expect(response.body.data.unreadCount).toBe(1);
      expect(response.body.data.meta).toMatchObject({ page: 1, pageSize: 10, total: 2 });
      expect(response.body.data.data[0]).toEqual({
        id: 'ntf-2', type: 'counter_offer', title: 'Você recebeu uma contraproposta',
        link: '/solicitacoes/req-9', read: false, createdAt: expect.any(String),
      });
      const unread = await api(app, producer).get('/me/notifications?unreadOnly=true').expect(200);
      expect(unread.body.data.meta.total).toBe(1);
    });

    it('marks one and all as read, only for the owner', async () => {
      await api(app, provider).post('/me/notifications/ntf-2/read').expect(404);
      await api(app, producer).post('/me/notifications/ntf-2/read').expect(204);
      const after = await api(app, producer).get('/me/notifications').expect(200);
      expect(after.body.data.unreadCount).toBe(0);
      await api(app, provider).post('/me/notifications/read-all').expect(204);
      const mine = await api(app, provider).get('/me/notifications').expect(200);
      expect(mine.body.data.unreadCount).toBe(0);
      await api(app).get('/me/notifications').expect(401);
    });
  });

  describe('conversation', () => {
    it('shows the messages in order to both parties only', async () => {
      const response = await api(app, producer).get('/requests/req-10/messages').expect(200);
      expect(response.body.data.map((message: { id: string }) => message.id)).toEqual(['msg-1', 'msg-2']);
      expect(response.body.data[0]).toMatchObject({ senderRole: 'producer', senderName: 'Carlos Henrique Souza' });
      await api(app, provider).get('/requests/req-10/messages').expect(200);
      const stranger = await login(app, 'prestador2@agroserv.com');
      const hidden = await api(app, stranger).get('/requests/req-10/messages').expect(404);
      expect(hidden.body.error.code).toBe('request_not_found');
      await api(app, await login(app, ADMIN)).get('/requests/req-10/messages').expect(404);
    });

    it('sends messages and notifies the other party once until read', async () => {
      const empty = await api(app, producer).post('/requests/req-10/messages', { text: '   ' }).expect(422);
      expect(empty.body.error.fields).toEqual({ text: 'Escreva uma mensagem de até 2000 caracteres.' });
      const sent = await api(app, producer).post('/requests/req-10/messages', { text: ' Chegamos às 8h. ' }).expect(201);
      expect(sent.body.data).toMatchObject({ text: 'Chegamos às 8h.', senderId: 'usr-1', requestId: 'req-10' });
      await api(app, producer).post('/requests/req-10/messages', { text: 'Levem o mapa.' }).expect(201);
      const inbox = await api(app, provider).get('/me/notifications?unreadOnly=true').expect(200);
      const messages = inbox.body.data.data.filter((notification: { type: string }) => notification.type === 'message');
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ title: 'Nova mensagem de Carlos Henrique Souza', link: '/prestador/solicitacoes/req-10' });
      await api(app, provider).post(`/me/notifications/${messages[0].id}/read`).expect(204);
      await api(app, producer).post('/requests/req-10/messages', { text: 'Combinado?' }).expect(201);
      const again = await api(app, provider).get('/me/notifications?unreadOnly=true').expect(200);
      expect(again.body.data.data.filter((notification: { type: string }) => notification.type === 'message')).toHaveLength(1);
    });

    it('closes the conversation with the request', async () => {
      const closed = await api(app, producer).post('/requests/req-4/messages', { text: 'Obrigado!' }).expect(409);
      expect(closed.body.error).toMatchObject({ code: 'conflict', message: 'Esta conversa está encerrada.' });
      await api(app, await login(app, ADMIN)).post('/requests/req-10/messages', { text: 'Olá' }).expect(403);
    });
  });

  describe('reviews', () => {
    let reviewId: string;

    it('only reviews completed requests, once', async () => {
      const open = await api(app, producer).post('/requests/req-1/review', { rating: 5 }).expect(409);
      expect(open.body.error.code).toBe('invalid_transition');
      const twice = await api(app, producer).post('/requests/req-4/review', { rating: 5 }).expect(409);
      expect(twice.body.error).toMatchObject({ code: 'conflict', message: 'Você já avaliou esta solicitação.' });
      const invalid = await api(app, producer).post('/requests/req-7/review', { rating: 6 }).expect(422);
      expect(invalid.body.error.fields).toHaveProperty('rating');
    });

    it('creates a review, updates the averages and notifies the provider', async () => {
      const before = await api(app).get('/services/svc-8').expect(200);
      const created = await api(app, producer).post('/requests/req-7/review', { rating: 2, comment: 'Atrasou dois dias.' }).expect(201);
      reviewId = created.body.data.id;
      expect(created.body.data).toMatchObject({
        requestId: 'req-7', serviceId: 'svc-8', providerId: 'prv-2', rating: 2, comment: 'Atrasou dois dias.', hidden: false,
      });
      const after = await api(app).get('/services/svc-8').expect(200);
      expect(after.body.data.reviewCount).toBe(before.body.data.reviewCount + 1);
      expect(after.body.data.rating).toBeCloseTo((4.7 * 65 + 2) / 66, 2);
      expect(after.body.data.provider.reviewCount).toBe(162);
      const detail = await api(app, producer).get('/requests/req-7').expect(200);
      expect(detail.body.data.reviewId).toBe(reviewId);
      expect(detail.body.data.review.rating).toBe(2);
      expect(detail.body.data.allowedActions).toEqual(['edit_review', 'report']);
      const inbox = await api(app, await login(app, 'prestador2@agroserv.com')).get('/me/notifications').expect(200);
      expect(inbox.body.data.data[0]).toMatchObject({
        type: 'review', title: 'Você recebeu uma avaliação de 2 estrelas', link: '/prestador/avaliacoes',
      });
    });

    it('edits inside the 7 day window adjusting the average', async () => {
      const edited = await api(app, producer).patch(`/reviews/${reviewId}`, { rating: 4 }).expect(200);
      expect(edited.body.data).toMatchObject({ rating: 4, comment: 'Atrasou dois dias.' });
      const service = await api(app).get('/services/svc-8').expect(200);
      expect(service.body.data.rating).toBeCloseTo((4.7 * 65 + 4) / 66, 2);
      await api(app, provider).patch(`/reviews/${reviewId}`, { rating: 1 }).expect(403);
      vi.spyOn(app.get(ClockService), 'now').mockReturnValue(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
      const late = await api(app, producer).patch(`/reviews/${reviewId}`, { rating: 1 }).expect(409);
      expect(late.body.error.message).toBe('O prazo para editar esta avaliação terminou.');
      const detail = await api(app, producer).get('/requests/req-7').expect(200);
      expect(detail.body.data.allowedActions).toEqual(['report']);
    });

    it('lists service reviews with summary and distribution', async () => {
      const response = await api(app).get('/services/svc-5/reviews').expect(200);
      expect(response.body.data.meta).toMatchObject({ page: 1, pageSize: 10, total: 1 });
      expect(response.body.data.data[0]).toMatchObject({ id: 'rev-1', rating: 5 });
      expect(response.body.data.data[0].reply.text).toBe('Obrigado pela confiança, Carlos!');
      expect(response.body.data.summary).toEqual({
        average: 4.8, count: 58, writtenCount: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
      });
      const filtered = await api(app).get('/services/svc-5/reviews?rating=3').expect(200);
      expect(filtered.body.data.meta.total).toBe(0);
      await api(app).get('/services/nope/reviews').expect(404);
    });

    it('lets the provider reply once with a single notification', async () => {
      const other = await login(app, 'prestador2@agroserv.com');
      const list = await api(app, other).get('/provider/reviews').expect(200);
      expect(list.body.data.data.map((review: { id: string }) => review.id)).toEqual([reviewId]);
      expect(list.body.data.summary.count).toBe(162);
      await api(app, provider).put(`/provider/reviews/${reviewId}/reply`, { text: 'Não é minha.' }).expect(404);
      const replied = await api(app, other).put(`/provider/reviews/${reviewId}/reply`, { text: 'Pedimos desculpas pelo atraso.' }).expect(200);
      expect(replied.body.data.reply.text).toBe('Pedimos desculpas pelo atraso.');
      const edited = await api(app, other).put(`/provider/reviews/${reviewId}/reply`, { text: 'Pedimos desculpas, já corrigimos.' }).expect(200);
      expect(edited.body.data.reply.createdAt).toBe(replied.body.data.reply.createdAt);
      const inbox = await api(app, producer).get('/me/notifications?pageSize=50').expect(200);
      const replies = inbox.body.data.data.filter((notification: { type: string }) => notification.type === 'review_reply');
      expect(replies).toHaveLength(1);
      expect(replies[0]).toMatchObject({ title: 'Campo Forte Serviços respondeu à sua avaliação', link: '/servicos/svc-8' });
    });
  });
});
