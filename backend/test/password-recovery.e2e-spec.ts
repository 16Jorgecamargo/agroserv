import { INestApplication } from '@nestjs/common';
import { ClockService } from '../src/common/clock.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { api, createApp, PRODUCER } from './helpers.js';

describe('password recovery', () => {
  let app: INestApplication;
  let links: string[];

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    links = [];
    vi.spyOn(app.get(MailService), 'sendPasswordReset').mockImplementation((_email, link) => {
      links.push(link);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const tokenOf = (link: string) => new URL(link).searchParams.get('token')!;

  it('always answers the same and never returns the token', async () => {
    const known = await api(app).post('/auth/forgot-password', { email: 'prestador2@agroserv.com' }).expect(200);
    const unknown = await api(app).post('/auth/forgot-password', { email: 'ninguem@agroserv.com' }).expect(200);
    expect(known.body.data).toEqual({ message: 'Se o e-mail existir, enviaremos um link.' });
    expect(unknown.body.data).toEqual(known.body.data);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('/redefinir-senha?token=');
  });

  it('resets the password once and invalidates older links', async () => {
    await api(app).post('/auth/forgot-password', { email: PRODUCER });
    await api(app).post('/auth/forgot-password', { email: PRODUCER });
    const [older, newer] = links.map(tokenOf);
    const stale = await api(app).post('/auth/reset-password', { token: older, password: 'novasenha1' }).expect(422);
    expect(stale.body.error.fields).toEqual({ token: 'Link inválido ou expirado.' });
    const short = await api(app).post('/auth/reset-password', { token: newer, password: '123' }).expect(422);
    expect(short.body.error.fields).toEqual({ password: 'A senha precisa ter pelo menos 8 caracteres.' });
    const done = await api(app).post('/auth/reset-password', { token: newer, password: 'novasenha1' }).expect(200);
    expect(done.body.data).toEqual({ message: 'Senha redefinida. Entre com a nova senha.' });
    await api(app).post('/auth/login', { email: PRODUCER, password: 'novasenha1' }).expect(200);
    await api(app).post('/auth/reset-password', { token: newer, password: 'outrasenha1' }).expect(422);
  });

  it('sends at most 3 links per account per hour', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await api(app).post('/auth/forgot-password', { email: 'prestador3@agroserv.com' }).expect(200);
    }
    expect(links).toHaveLength(3);
  });

  it('expires the link after 60 minutes', async () => {
    await api(app).post('/auth/forgot-password', { email: 'prestador5@agroserv.com' });
    const clock = app.get(ClockService);
    const later = new Date(Date.now() + 61 * 60 * 1000);
    vi.spyOn(clock, 'now').mockReturnValue(later);
    await api(app).post('/auth/reset-password', { token: tokenOf(links[0]), password: 'novasenha1' }).expect(422);
  });
});
