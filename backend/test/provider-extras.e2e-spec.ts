import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { addDays, ClockService } from '../src/common/clock.service.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('provider extras', () => {
  let app: INestApplication;
  let provider: string;
  let producer: string;
  let today: string;

  const upload = async (token: string, purpose: string) => {
    const response = await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${token}`)
      .field('purpose', purpose)
      .attach('file', PNG, { filename: 'doc.png', contentType: 'image/png' })
      .expect(201);
    return response.body.data as { id: string; url: string };
  };

  beforeAll(async () => {
    app = await createApp();
    provider = await login(app, PROVIDER);
    producer = await login(app, PRODUCER);
    today = app.get(ClockService).today();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('equipment', () => {
    it('creates, edits and validates equipment', async () => {
      const list = await api(app, provider).get('/provider/equipment').expect(200);
      expect(list.body.data.map((item: { id: string }) => item.id)).toEqual(['eqp-1', 'eqp-2']);
      const invalid = await api(app, provider).post('/provider/equipment', { type: 'boat', model: 'x', year: 1900 }).expect(422);
      expect(invalid.body.error.fields).toEqual({
        type: 'Selecione o tipo.', model: 'Informe marca e modelo.', year: 'Informe um ano válido.',
      });
      const future = await api(app, provider).post('/provider/equipment', { type: 'drone', model: 'DJI Agras T40', year: 2999 }).expect(422);
      expect(future.body.error.fields).toEqual({ year: 'Informe um ano válido.' });
      const photo = await upload(provider, 'public');
      const created = await api(app, provider).post('/provider/equipment', {
        type: 'drone', model: 'DJI Agras T40', year: 2024, photos: [photo.url],
      }).expect(201);
      expect(created.body.data).toMatchObject({ providerId: 'prv-1', specs: '', photos: [photo.url] });
      const edited = await api(app, provider).patch(`/provider/equipment/${created.body.data.id}`, { specs: 'Tanque de 40 L.' }).expect(200);
      expect(edited.body.data).toMatchObject({ specs: 'Tanque de 40 L.', model: 'DJI Agras T40' });
      const other = await login(app, 'prestador2@agroserv.com');
      const hidden = await api(app, other).patch(`/provider/equipment/${created.body.data.id}`, { specs: 'x' }).expect(404);
      expect(hidden.body.error.code).toBe('equipment_not_found');
    });

    it('removes the equipment and its link with services', async () => {
      const before = await api(app).get('/services/svc-1').expect(200);
      expect(before.body.data.equipmentIds).toEqual(['eqp-1']);
      await api(app, provider).delete('/provider/equipment/eqp-1').expect(204);
      const after = await api(app).get('/services/svc-1').expect(200);
      expect(after.body.data.equipmentIds).toEqual([]);
      expect(after.body.data.equipment).toEqual([]);
      await api(app, provider).delete('/provider/equipment/eqp-1').expect(404);
    });
  });

  describe('agenda', () => {
    it('shows the month with blocked days and scheduled requests', async () => {
      const month = addDays(today, 3).slice(0, 7);
      const response = await api(app, provider).get(`/provider/agenda?month=${month}`).expect(200);
      expect(response.body.data.month).toBe(month);
      const ids = response.body.data.requests.map((item: { id: string }) => item.id);
      expect(ids).toContain('req-10');
      expect(ids).not.toContain('req-1');
      const fallback = await api(app, provider).get('/provider/agenda?month=13-2026').expect(200);
      expect(fallback.body.data.month).toBe(today.slice(0, 7));
    });

    it('blocks and unblocks days from today on, idempotently', async () => {
      const day = addDays(today, 6);
      const past = await api(app, provider).post('/provider/blocked-days', { date: addDays(today, -1) }).expect(422);
      expect(past.body.error.fields).toEqual({ date: 'Escolha uma data a partir de hoje.' });
      await api(app, provider).post('/provider/blocked-days', { date: 'amanhã' }).expect(422);
      const blocked = await api(app, provider).post('/provider/blocked-days', { date: day }).expect(201);
      expect(blocked.body.data).toEqual({ date: day });
      await api(app, provider).post('/provider/blocked-days', { date: day }).expect(201);
      const publicDays = await api(app).get('/services/svc-1/blocked-days').expect(200);
      expect(publicDays.body.data).toEqual([day, addDays(today, 15)]);
      const refused = await api(app, producer).post('/requests', {
        serviceId: 'svc-5', propertyId: 'prop-1', scheduledDate: day, quantity: 3,
      }).expect(422);
      expect(refused.body.error.fields).toEqual({ scheduledDate: 'O prestador não atende nesta data.' });
      await api(app, provider).delete(`/provider/blocked-days/${day}`).expect(204);
      await api(app, provider).delete(`/provider/blocked-days/${day}`).expect(204);
      const ranged = await api(app).get(`/services/svc-1/blocked-days?from=${today}&to=${addDays(today, 10)}`).expect(200);
      expect(ranged.body.data).toEqual([]);
      await api(app).get('/services/nope/blocked-days').expect(404);
    });

    it('keeps scheduled requests when their day gets blocked', async () => {
      const day = addDays(today, 3);
      await api(app, provider).post('/provider/blocked-days', { date: day }).expect(201);
      const detail = await api(app, provider).get('/provider/requests/req-10').expect(200);
      expect(detail.body.data.status).toBe('accepted');
    });
  });

  describe('verification', () => {
    it('shows the current status with signed document links', async () => {
      const approved = await api(app, provider).get('/provider/verification').expect(200);
      expect(approved.body.data).toMatchObject({ status: 'approved', documents: [] });
      const reviewing = await api(app, await login(app, 'prestador3@agroserv.com')).get('/provider/verification').expect(200);
      expect(reviewing.body.data.status).toBe('under_review');
      expect(reviewing.body.data.documents.map((document: { kind: string }) => document.kind)).toEqual(['identity', 'address']);
      expect(reviewing.body.data.documents[0].url).toContain('?token=');
    });

    it('requires the document number and verification uploads', async () => {
      const token = await login(app, 'prestador4@agroserv.com');
      const identity = await upload(token, 'verification');
      const address = await upload(token, 'verification');
      const body = { identityUploadId: identity.id, addressUploadId: address.id };
      const noDocument = await api(app, token).post('/provider/verification', body).expect(422);
      expect(noDocument.body.error.fields).toEqual({ document: 'Preencha o CPF ou CNPJ no seu perfil antes de enviar.' });
      await api(app, token).patch('/provider/profile', { document: '12.345.678/0001-99' }).expect(200);
      const publicFile = await upload(token, 'public');
      const wrongPurpose = await api(app, token).post('/provider/verification', { ...body, addressUploadId: publicFile.id }).expect(422);
      expect(wrongPurpose.body.error.fields).toHaveProperty('addressUploadId');
      const foreign = await upload(provider, 'verification');
      await api(app, token).post('/provider/verification', { ...body, identityUploadId: foreign.id }).expect(422);
      const sent = await api(app, token).post('/provider/verification', body).expect(200);
      expect(sent.body.data.status).toBe('under_review');
      expect(sent.body.data.documents).toHaveLength(2);
      const again = await api(app, token).post('/provider/verification', body).expect(409);
      expect(again.body.error).toMatchObject({ code: 'conflict', message: 'Sua verificação já foi enviada.' });
      const admin = await api(app, await login(app, ADMIN)).get('/me/notifications').expect(200);
      expect(admin.body.data.data[0]).toMatchObject({
        type: 'verification_submitted', title: 'Nova verificação de Transportes Vale Verde', link: '/admin/verificacoes',
      });
    });

    it('resets an approved verification when the document changes', async () => {
      const changed = await api(app, provider).patch('/provider/profile', { document: '987.654.321-00' }).expect(200);
      expect(changed.body.data.verificationStatus).toBe('not_sent');
      const service = await api(app).get('/services/svc-1').expect(200);
      expect(service.body.data.providerVerified).toBe(false);
    });
  });
});
