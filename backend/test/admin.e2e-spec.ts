import { INestApplication } from '@nestjs/common';
import { ClockService } from '../src/common/clock.service.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

describe('admin area', () => {
  let app: INestApplication;
  let admin: string;
  let producer: string;
  let provider: string;

  beforeAll(async () => {
    app = await createApp();
    admin = await login(app, ADMIN);
    producer = await login(app, PRODUCER);
    provider = await login(app, PROVIDER);
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps every admin route away from other roles', async () => {
    for (const path of ['/admin/dashboard', '/admin/users', '/admin/reports', '/admin/categories', '/admin/actions']) {
      await api(app, producer).get(path).expect(403);
      await api(app, provider).get(path).expect(403);
      await api(app).get(path).expect(401);
    }
  });

  it('shows the dashboard numbers', async () => {
    const response = await api(app, admin).get('/admin/dashboard').expect(200);
    expect(response.body.data).toMatchObject({
      users: { producers: 1, providers: 6, admins: 1 },
      newUsersLast7Days: 0,
      activeServices: 12,
      pendingVerifications: 1,
      openReports: 1,
    });
    expect(response.body.data.requestsByStatus).toEqual({
      pending: 2, counter_offer: 1, accepted: 2, in_progress: 2, completed: 3, rejected: 1, cancelled: 2,
    });
    expect(response.body.data.topCategories[0]).toEqual({ categoryId: 'cat-spraying', name: 'Pulverização', requests: 5 });
    expect(response.body.data.topCategories).toHaveLength(5);
  });

  describe('users', () => {
    it('searches and filters users, newest first', async () => {
      const all = await api(app, admin).get('/admin/users').expect(200);
      expect(all.body.data.meta).toMatchObject({ page: 1, pageSize: 20, total: 8 });
      expect(all.body.data.data[0].id).toBe('prv-6');
      const byName = await api(app, admin).get('/admin/users?q=irriga').expect(200);
      expect(byName.body.data.data.map((user: { id: string }) => user.id)).toEqual(['prv-3']);
      const byEmail = await api(app, admin).get('/admin/users?q=PRODUTOR@agroserv').expect(200);
      expect(byEmail.body.data.data.map((user: { id: string }) => user.id)).toEqual(['usr-1']);
      const byRole = await api(app, admin).get('/admin/users?role=provider&status=active').expect(200);
      expect(byRole.body.data.meta.total).toBe(6);
    });

    it('shows the user detail with requests, services, reviews and actions', async () => {
      const response = await api(app, admin).get('/admin/users/prv-1').expect(200);
      expect(response.body.data.user.email).toBe('prestador@agroserv.com');
      expect(response.body.data.providerProfile.document).toBe('12345678000190');
      expect(response.body.data.requests).toHaveLength(7);
      expect(response.body.data.services.map((service: { id: string }) => service.id).sort()).toEqual(['svc-1', 'svc-5']);
      expect(response.body.data.reviews.map((review: { id: string }) => review.id)).toEqual(['rev-1']);
      expect(response.body.data.actions[0].action).toBe('approve_verification');
      const producerDetail = await api(app, admin).get('/admin/users/usr-1').expect(200);
      expect(producerDetail.body.data).not.toHaveProperty('services');
      const missing = await api(app, admin).get('/admin/users/nope').expect(404);
      expect(missing.body.error.code).toBe('user_not_found');
    });

    it('opens any request read-only with both phones', async () => {
      const response = await api(app, admin).get('/admin/requests/req-1').expect(200);
      expect(response.body.data.allowedActions).toEqual([]);
      expect(response.body.data.producer.phone).toBe('45999110001');
      expect(response.body.data.provider.phone).toBe('45999220001');
      await api(app, admin).get('/admin/requests/nope').expect(404);
    });

    it('creates an admin that must change the provisional password', async () => {
      const body = { name: 'Nova Admin', email: 'nova@agroserv.com', password: 'provisoria1', city: 'Toledo', state: 'PR' };
      const short = await api(app, admin).post('/admin/users', { ...body, password: '123' }).expect(422);
      expect(short.body.error.fields).toEqual({ password: 'A senha precisa ter pelo menos 8 caracteres.' });
      const created = await api(app, admin).post('/admin/users', body).expect(201);
      expect(created.body.data).toMatchObject({ role: 'admin', mustChangePassword: true });
      const token = await login(app, 'nova@agroserv.com', 'provisoria1');
      await api(app, token).patch('/me/password', { currentPassword: 'provisoria1', newPassword: 'definitiva1' }).expect(200);
      const me = await api(app, token).get('/auth/me').expect(200);
      expect(me.body.data).not.toHaveProperty('mustChangePassword');
    });

    it('suspends a provider with every effect of the contract', async () => {
      const target = await login(app, 'prestador2@agroserv.com');
      const noReason = await api(app, admin).post('/admin/users/prv-2/suspend', {}).expect(422);
      expect(noReason.body.error.fields).toHaveProperty('reason');
      const response = await api(app, admin).post('/admin/users/prv-2/suspend', { reason: 'Fraude confirmada.' }).expect(200);
      expect(response.body.data.status).toBe('suspended');
      await api(app, target).get('/auth/me').expect(401);
      const blocked = await api(app).post('/auth/login', { email: 'prestador2@agroserv.com', password: '123456' }).expect(403);
      expect(blocked.body.error).toMatchObject({
        code: 'account_suspended', message: 'Sua conta está suspensa. Entre em contato com o suporte.',
      });
      const request = await api(app, producer).get('/requests/req-2').expect(200);
      expect(request.body.data).toMatchObject({
        status: 'cancelled', cancelledBy: 'system', cancelReason: 'Conta suspensa pela administração',
      });
      expect(request.body.data.events.at(-1)).toMatchObject({ type: 'cancelled', actorRole: 'system', actorId: null });
      const inbox = await api(app, producer).get('/me/notifications').expect(200);
      expect(inbox.body.data.data[0]).toMatchObject({
        title: 'Solicitação cancelada pela administração', link: '/solicitacoes/req-2',
      });
      await api(app).get('/services/svc-2').expect(404);
      const again = await api(app, admin).post('/admin/users/prv-2/suspend', { reason: 'De novo.' }).expect(409);
      expect(again.body.error.message).toBe('Esta conta já está suspensa.');
    });

    it('reactivates the account bringing its services back', async () => {
      const response = await api(app, admin).post('/admin/users/prv-2/reactivate').expect(200);
      expect(response.body.data.status).toBe('active');
      const service = await api(app).get('/services/svc-2').expect(200);
      expect(service.body.data.status).toBe('active');
      const request = await api(app, producer).get('/requests/req-2').expect(200);
      expect(request.body.data.status).toBe('cancelled');
      const active = await api(app, admin).post('/admin/users/prv-2/reactivate').expect(409);
      expect(active.body.error.message).toBe('Esta conta já está ativa.');
    });

    it('never suspends the own account', async () => {
      const response = await api(app, admin).post('/admin/users/adm-1/suspend', { reason: 'Teste de bloqueio.' }).expect(409);
      expect(response.body.error.message).toBe('Você não pode suspender a sua própria conta.');
    });
  });

  describe('verifications', () => {
    it('lists the queue with documents and decides it', async () => {
      const queue = await api(app, admin).get('/admin/verifications').expect(200);
      expect(queue.body.data).toHaveLength(1);
      expect(queue.body.data[0]).toMatchObject({ email: 'prestador3@agroserv.com', document: '34567890000112' });
      expect(queue.body.data[0].provider.id).toBe('prv-3');
      const url = queue.body.data[0].verification.documents[0].url as string;
      await api(app).get(url.replace(/^https?:\/\/[^/]+/, '')).expect(200);
      const noReason = await api(app, admin).post('/admin/verifications/prv-3/reject', { reason: 'x' }).expect(422);
      expect(noReason.body.error.fields).toHaveProperty('reason');
      const rejected = await api(app, admin).post('/admin/verifications/prv-3/reject', { reason: 'Documento ilegível.' }).expect(200);
      expect(rejected.body.data).toMatchObject({ status: 'rejected', rejectionReason: 'Documento ilegível.' });
      const target = await login(app, 'prestador3@agroserv.com');
      const inbox = await api(app, target).get('/me/notifications').expect(200);
      expect(inbox.body.data.data[0]).toMatchObject({
        type: 'verification', title: 'Sua verificação foi rejeitada', body: 'Documento ilegível.', link: '/prestador/verificacao',
      });
      const stale = await api(app, admin).post('/admin/verifications/prv-3/approve').expect(409);
      expect(stale.body.error.code).toBe('invalid_transition');
    });

    it('approves a resubmitted verification giving the badge', async () => {
      const target = await login(app, 'prestador3@agroserv.com');
      const current = await api(app, target).get('/provider/verification').expect(200);
      const [identity, address] = current.body.data.documents;
      await api(app, target).post('/provider/verification', { identityUploadId: identity.uploadId, addressUploadId: address.uploadId }).expect(200);
      const approved = await api(app, admin).post('/admin/verifications/prv-3/approve').expect(200);
      expect(approved.body.data.status).toBe('approved');
      const service = await api(app).get('/services/svc-10').expect(200);
      expect(service.body.data.providerVerified).toBe(true);
      expect(service.body.data.provider.verified).toBe(true);
    });
  });

  describe('service moderation', () => {
    it('lists every service with search and filters', async () => {
      const all = await api(app, admin).get('/admin/services').expect(200);
      expect(all.body.data.meta.total).toBe(12);
      const filtered = await api(app, admin).get('/admin/services?category=manutencao&q=irrigacao&status=active').expect(200);
      expect(filtered.body.data.data.map((service: { id: string }) => service.id)).toEqual(['svc-12']);
    });

    it('hides with a reason and shows again restoring the previous status', async () => {
      await api(app, provider).post('/provider/services/svc-5/pause').expect(200);
      const hidden = await api(app, admin).post('/admin/services/svc-5/hide', { reason: 'Fotos enganosas.' }).expect(200);
      expect(hidden.body.data).toMatchObject({ status: 'hidden', hiddenReason: 'Fotos enganosas.' });
      const mine = await api(app, provider).get('/provider/services/svc-5').expect(200);
      expect(mine.body.data.hiddenReason).toBe('Fotos enganosas.');
      const blocked = await api(app, provider).post('/provider/services/svc-5/activate').expect(409);
      expect(blocked.body.error.message).toBe('Anúncio oculto pela administração.');
      const edited = await api(app, provider).patch('/provider/services/svc-5', { price: 99 }).expect(200);
      expect(edited.body.data.status).toBe('hidden');
      const inbox = await api(app, provider).get('/me/notifications').expect(200);
      expect(inbox.body.data.data[0]).toMatchObject({
        type: 'service_hidden', title: 'Seu anúncio foi ocultado', body: 'Fotos enganosas.', link: '/prestador/servicos',
      });
      await api(app, admin).post('/admin/services/svc-5/hide', { reason: 'De novo aqui.' }).expect(409);
      const shown = await api(app, admin).post('/admin/services/svc-5/show').expect(200);
      expect(shown.body.data.status).toBe('paused');
      expect(shown.body.data).not.toHaveProperty('hiddenReason');
      await api(app, admin).post('/admin/services/svc-5/show').expect(409);
    });

    it('removes a service unless it has open requests', async () => {
      const blocked = await api(app, admin).delete('/admin/services/svc-1').expect(409);
      expect(blocked.body.error.message).toBe('Este serviço tem solicitações em aberto. Pause o anúncio em vez de excluir.');
      await api(app, admin).delete('/admin/services/svc-9').expect(204);
      await api(app).get('/services/svc-9').expect(404);
      await api(app, admin).delete('/admin/services/svc-9').expect(404);
    });
  });

  describe('categories', () => {
    let categoryId: string;

    it('lists all categories with service counts', async () => {
      const response = await api(app, admin).get('/admin/categories').expect(200);
      expect(response.body.data).toHaveLength(8);
      const machinery = response.body.data.find((category: { id: string }) => category.id === 'cat-machinery');
      expect(machinery.serviceCount).toBe(1);
    });

    it('creates with a generated slug and validates uniqueness', async () => {
      const created = await api(app, admin).post('/admin/categories', { name: 'Silagem e Fenação', icon: 'leaf' }).expect(201);
      categoryId = created.body.data.id;
      expect(created.body.data).toMatchObject({ slug: 'silagem-e-fenacao', active: true });
      const sameName = await api(app, admin).post('/admin/categories', { name: 'silagem e fenacao', icon: 'leaf', slug: 'outra' }).expect(422);
      expect(sameName.body.error.fields).toEqual({ name: 'Já existe uma categoria com este nome.' });
      const sameSlug = await api(app, admin).post('/admin/categories', { name: 'Outra', icon: 'leaf', slug: 'plantio' }).expect(422);
      expect(sameSlug.body.error.fields).toEqual({ slug: 'Já existe uma categoria com este endereço.' });
      const invalid = await api(app, admin).post('/admin/categories', { name: 'X', icon: 'rocket' }).expect(422);
      expect(invalid.body.error.fields).toEqual({ name: 'Informe o nome.', icon: 'Selecione um ícone.' });
    });

    it('deactivates without hiding existing services', async () => {
      const updated = await api(app, admin).patch('/admin/categories/cat-transport', { active: false }).expect(200);
      expect(updated.body.data.active).toBe(false);
      const publicList = await api(app).get('/categories').expect(200);
      expect(publicList.body.data.map((category: { id: string }) => category.id)).not.toContain('cat-transport');
      const refused = await api(app, provider).post('/provider/services', {
        title: 'Frete de Calcário', categoryId: 'cat-transport', description: 'Transporte de calcário a granel na região.',
        price: 500, priceUnit: 'trip', city: 'Santa Helena', state: 'PR',
      }).expect(422);
      expect(refused.body.error.fields).toEqual({ categoryId: 'Selecione uma categoria.' });
      await api(app, admin).patch('/admin/categories/cat-transport', { active: true }).expect(200);
    });

    it('deletes only categories without services', async () => {
      const blocked = await api(app, admin).delete('/admin/categories/cat-planting').expect(409);
      expect(blocked.body.error.message).toBe('Esta categoria tem serviços. Desative em vez de apagar.');
      await api(app, admin).delete(`/admin/categories/${categoryId}`).expect(204);
      await api(app, admin).delete(`/admin/categories/${categoryId}`).expect(404);
    });
  });

  describe('reports', () => {
    const report = (overrides: object = {}) => ({
      targetType: 'service', targetId: 'svc-3', reason: 'fraud', description: 'Cobrou adiantado e não apareceu.', ...overrides,
    });

    it('respects who can report what', async () => {
      const short = await api(app, producer).post('/reports', report({ description: 'curta' })).expect(422);
      expect(short.body.error.fields).toEqual({ description: 'Descreva o problema com pelo menos 10 caracteres.' });
      const wrongType = await api(app, producer).post('/reports', report({ targetType: 'review', targetId: 'rev-1' })).expect(422);
      expect(wrongType.body.error.fields).toEqual({ targetType: 'Você não pode denunciar este item.' });
      await api(app, provider).post('/reports', report()).expect(422);
      await api(app, producer).post('/reports', report({ targetId: 'nope' })).expect(404);
      await api(app, producer).post('/reports', report({ targetType: 'request', targetId: 'nope' })).expect(404);
      const stranger = await api(app, producer).post('/reports', report({ targetType: 'user', targetId: 'adm-1' })).expect(422);
      expect(stranger.body.error.fields).toHaveProperty('targetType');
      await api(app, admin).post('/reports', report()).expect(403);
    });

    it('creates a report, blocks duplicates and notifies admins', async () => {
      const created = await api(app, producer).post('/reports', report()).expect(201);
      expect(created.body.data).toMatchObject({
        status: 'open', targetLabel: 'Plantio Direto de Precisão', reporterRole: 'producer', reporterName: 'Carlos Henrique Souza',
      });
      const duplicate = await api(app, producer).post('/reports', report()).expect(409);
      expect(duplicate.body.error.message).toBe('Você já denunciou este item. Aguarde a análise.');
      const inbox = await api(app, admin).get('/me/notifications').expect(200);
      expect(inbox.body.data.data[0]).toMatchObject({
        type: 'report_created', title: 'Nova denúncia: Golpe ou fraude', link: '/admin/denuncias',
      });
    });

    it('lists the queue oldest first with filters', async () => {
      const open = await api(app, admin).get('/admin/reports').expect(200);
      expect(open.body.data.data[0].id).toBe('rep-1');
      expect(open.body.data.meta.total).toBe(2);
      const byType = await api(app, admin).get('/admin/reports?status=all&targetType=request').expect(200);
      expect(byType.body.data.meta.total).toBe(0);
    });

    it('unlocks the conversation for admins once a request is reported', async () => {
      await api(app, admin).get('/requests/req-11/messages').expect(404);
      const created = await api(app, provider).post('/reports', report({
        targetType: 'request', targetId: 'req-11', reason: 'offensive', description: 'O produtor foi ofensivo na conversa.',
      })).expect(201);
      expect(created.body.data.targetLabel).toBe('Solicitação req-11 · Pulverização Agrícola');
      await api(app, admin).get('/requests/req-11/messages').expect(200);
      const detail = await api(app, admin).get(`/admin/reports/${created.body.data.id}`).expect(200);
      expect(detail.body.data.target.id).toBe('req-11');
      expect(detail.body.data.messages).toEqual([]);
      const noUser = await api(app, admin).post(`/admin/reports/${created.body.data.id}/resolve`, {
        action: 'warn', message: 'Mantenha o respeito.', internalNote: 'Primeira ocorrência.',
      }).expect(422);
      expect(noUser.body.error.fields).toHaveProperty('targetUserId');
      const resolved = await api(app, admin).post(`/admin/reports/${created.body.data.id}/resolve`, {
        action: 'warn', targetUserId: 'usr-1', message: 'Mantenha o respeito.', internalNote: 'Primeira ocorrência.',
      }).expect(200);
      expect(resolved.body.data).toMatchObject({ status: 'resolved' });
      expect(resolved.body.data.resolution).toMatchObject({ action: 'warn', targetUserId: 'usr-1', adminId: 'adm-1' });
      const warned = await api(app, producer).get('/me/notifications').expect(200);
      expect(warned.body.data.data[0]).toMatchObject({
        type: 'warning', title: 'Aviso da administração', body: 'Mantenha o respeito.', link: '/notificacoes',
      });
      const reporter = await api(app, provider).get('/me/notifications').expect(200);
      expect(reporter.body.data.data[0]).toMatchObject({
        type: 'report_resolved', title: 'Sua denúncia foi analisada.', link: '/prestador/notificacoes',
      });
      expect(JSON.stringify(reporter.body.data)).not.toContain('Primeira ocorrência');
    });

    it('validates the resolution and hides a reported service', async () => {
      const wrongAction = await api(app, admin).post('/admin/reports/rep-1/resolve', {
        action: 'hide_review', internalNote: 'Conferido com o prestador.',
      }).expect(422);
      expect(wrongAction.body.error.fields).toHaveProperty('action');
      const noMessage = await api(app, admin).post('/admin/reports/rep-1/resolve', {
        action: 'hide_service', internalNote: 'Conferido com o prestador.',
      }).expect(422);
      expect(noMessage.body.error.fields).toEqual({ message: 'Escreva a mensagem para o usuário.' });
      const detail = await api(app, admin).get('/admin/reports/rep-1').expect(200);
      expect(detail.body.data.target).toMatchObject({ id: 'svc-12', status: 'active' });
      const resolved = await api(app, admin).post('/admin/reports/rep-1/resolve', {
        action: 'hide_service', message: 'O anúncio informa área de atendimento errada.', internalNote: 'Conferido com o prestador.',
      }).expect(200);
      expect(resolved.body.data.status).toBe('resolved');
      await api(app).get('/services/svc-12').expect(404);
      const again = await api(app, admin).post('/admin/reports/rep-1/resolve', { action: 'archive', internalNote: 'Duplicada.' }).expect(409);
      expect(again.body.error.code).toBe('invalid_transition');
      await api(app, admin).get('/admin/reports/nope').expect(404);
    });

    it('hides a reported review removing it from the average and archives others', async () => {
      await api(app, provider).post('/provider/services/svc-5/activate').expect(200);
      const before = await api(app).get('/services/svc-5').expect(200);
      const created = await api(app, provider).post('/reports', report({
        targetType: 'review', targetId: 'rev-1', reason: 'false_info', description: 'A avaliação cita outro serviço.',
      })).expect(201);
      await api(app, admin).post(`/admin/reports/${created.body.data.id}/resolve`, {
        action: 'hide_review', internalNote: 'Avaliação fora do contexto.',
      }).expect(200);
      const after = await api(app).get('/services/svc-5').expect(200);
      expect(after.body.data.reviewCount).toBe(before.body.data.reviewCount - 1);
      expect(after.body.data.rating).toBeCloseTo((4.8 * 58 - 5) / 57, 2);
      const publicReviews = await api(app).get('/services/svc-5/reviews').expect(200);
      expect(publicReviews.body.data.meta.total).toBe(0);
      const mine = await api(app, provider).get('/provider/reviews').expect(200);
      expect(mine.body.data.data[0]).toMatchObject({ id: 'rev-1', hidden: true });
      const svc3 = await api(app, admin).get('/admin/reports?targetType=service').expect(200);
      const archived = await api(app, admin).post(`/admin/reports/${svc3.body.data.data[0].id}/resolve`, {
        action: 'archive', internalNote: 'Sem provas suficientes.',
      }).expect(200);
      expect(archived.body.data.status).toBe('dismissed');
    });
  });

  describe('history', () => {
    it('records every admin write with filters and no write endpoints', async () => {
      const all = await api(app, admin).get('/admin/actions?pageSize=100').expect(200);
      const types = new Set(all.body.data.data.map((action: { action: string }) => action.action));
      for (const type of [
        'create_admin', 'suspend_user', 'reactivate_user', 'approve_verification', 'reject_verification',
        'hide_service', 'show_service', 'delete_service', 'create_category', 'update_category', 'delete_category',
        'resolve_report', 'dismiss_report', 'hide_review', 'warn_user',
      ]) {
        expect(types).toContain(type);
      }
      expect(all.body.data.data[0]).toMatchObject({ adminId: 'adm-1', adminName: 'Administração AgroServ' });
      const suspended = await api(app, admin).get('/admin/actions?action=suspend_user').expect(200);
      expect(suspended.body.data.data).toHaveLength(1);
      expect(suspended.body.data.data[0]).toMatchObject({ targetId: 'prv-2', reason: 'Fraude confirmada.' });
      const today = app.get(ClockService).today();
      const period = await api(app, admin).get(`/admin/actions?from=${today}&to=${today}&pageSize=100`).expect(200);
      expect(period.body.data.meta.total).toBe(all.body.data.meta.total - 1);
      const other = await api(app, admin).get('/admin/actions?adminId=nobody').expect(200);
      expect(other.body.data.meta.total).toBe(0);
      await api(app, admin).delete(`/admin/actions/${all.body.data.data[0].id}`).expect(404);
    });
  });
});
