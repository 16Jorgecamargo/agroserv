import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('uploads', () => {
  let app: INestApplication;
  let provider: string;

  const send = (token: string, purpose?: string, file = PNG, name = 'foto.png', type = 'image/png') => {
    const call = request(app.getHttpServer()).post('/uploads').set('Authorization', `Bearer ${token}`);
    if (purpose) void call.field('purpose', purpose);
    return call.attach('file', file, { filename: name, contentType: type });
  };
  const pathOf = (url: string) => url.replace(/^https?:\/\/[^/]+/, '');

  beforeAll(async () => {
    app = await createApp();
    provider = await login(app, PROVIDER);
  });

  afterAll(async () => {
    await app.close();
  });

  it('stores a public image anyone can open', async () => {
    const response = await send(provider).expect(201);
    expect(response.body.data).toMatchObject({ name: 'foto.png', contentType: 'image/png', size: PNG.length, purpose: 'public' });
    const file = await api(app).get(pathOf(response.body.data.url)).expect(200);
    expect(file.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(file.body as Buffer, PNG)).toBe(0);
  });

  it('rejects unsupported types, big files and anonymous uploads', async () => {
    const type = await send(provider, undefined, Buffer.from('oi'), 'nota.txt', 'text/plain').expect(422);
    expect(type.body.error.fields).toEqual({ file: 'Envie uma imagem JPG, PNG ou WEBP, ou um PDF.' });
    const big = await send(provider, undefined, Buffer.alloc(5 * 1024 * 1024 + 10), 'grande.png').expect(422);
    expect(big.body.error.fields).toEqual({ file: 'O arquivo deve ter no máximo 5 MB.' });
    await request(app.getHttpServer()).post('/uploads').attach('file', PNG, 'foto.png').expect(401);
  });

  it('keeps verification documents private to the owner and admins', async () => {
    const response = await send(provider, 'verification').expect(201);
    const signed = pathOf(response.body.data.url);
    const bare = signed.split('?')[0];
    expect(signed).toContain('?token=');
    await api(app).get(signed).expect(200);
    await api(app).get(bare).expect(404);
    await api(app, await login(app, PRODUCER)).get(bare).expect(404);
    await api(app, provider).get(bare).expect(200);
    await api(app, await login(app, ADMIN)).get(bare).expect(200);
  });

  it('accepts only own public uploads as avatar', async () => {
    const mine = await send(provider).expect(201);
    const updated = await api(app, provider).patch('/me', { avatarUrl: mine.body.data.url }).expect(200);
    expect(updated.body.data.avatarUrl).toBe(mine.body.data.url);
    const producer = await login(app, PRODUCER);
    const other = await api(app, producer).patch('/me', { avatarUrl: mine.body.data.url }).expect(422);
    expect(other.body.error.fields).toHaveProperty('avatarUrl');
    const removed = await api(app, provider).patch('/me', { avatarUrl: null }).expect(200);
    expect(removed.body.data).not.toHaveProperty('avatarUrl');
  });
});
