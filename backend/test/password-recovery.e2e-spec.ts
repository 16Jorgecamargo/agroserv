import type { AddressInfo } from 'node:net';
import { INestApplication } from '@nestjs/common';
import { simpleParser, type ParsedMail } from 'mailparser';
import { SMTPServer } from 'smtp-server';
import { ClockService } from '../src/services/clock.service.js';
import { api, createApp, PRODUCER } from './helpers.js';

describe('password recovery', () => {
  let app: INestApplication;
  let smtp: SMTPServer;
  let inbox: ParsedMail[];

  beforeAll(async () => {
    smtp = new SMTPServer({
      authOptional: true,
      disabledCommands: ['STARTTLS', 'AUTH'],
      onData(stream, _session, callback) {
        void simpleParser(stream).then((mail) => {
          inbox.push(mail);
          callback();
        });
      },
    });
    await new Promise<void>((resolve) => smtp.listen(0, '127.0.0.1', resolve));
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String((smtp.server.address() as AddressInfo).port);
    process.env.MAIL_FROM = 'AgroServ <no-reply@agroserv.test>';
    app = await createApp();
  });

  beforeEach(() => {
    inbox = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve) => smtp.close(() => resolve()));
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.MAIL_FROM;
  });

  const delivered = async (count: number) => {
    await vi.waitFor(() => expect(inbox.length).toBeGreaterThanOrEqual(count), { timeout: 5000 });
    return inbox;
  };
  const tokenOf = (mail: ParsedMail) => {
    const link = /https?:\/\/\S+\/redefinir-senha\?token=[0-9a-f]+/.exec(mail.text ?? '')![0];
    return new URL(link).searchParams.get('token')!;
  };

  it('sends a real e-mail with the reset link through SMTP', async () => {
    const response = await api(app).post('/auth/forgot-password', { email: 'prestador2@agroserv.com' }).expect(200);
    expect(response.body.data).toEqual({ message: 'Se o e-mail existir, enviaremos um link.' });
    const [mail] = await delivered(1);
    expect(mail.subject).toBe('AgroServ: redefinição de senha');
    expect(mail.from?.text).toBe('"AgroServ" <no-reply@agroserv.test>');
    expect((mail.to as { text: string }).text).toBe('prestador2@agroserv.com');
    expect(mail.text).toContain('Olá, Campo Forte Serviços.');
    expect(mail.text).toContain('O link vale por 60 minutos');
    expect(mail.html).toContain('Criar nova senha');
    expect(mail.html).toContain(`/redefinir-senha?token=${tokenOf(mail)}`);
  });

  it('embeds the AgroServ logo inline in the reset e-mail', async () => {
    await api(app).post('/auth/forgot-password', { email: 'prestador2@agroserv.com' }).expect(200);
    const [mail] = await delivered(1);
    const logo = mail.attachments.find((attachment) => attachment.cid === 'agroserv-logo');
    expect(logo?.contentType).toBe('image/png');
    expect(logo?.content.length).toBeGreaterThan(0);
    expect(mail.html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="AgroServ"/);
  });

  it('answers the same for unknown accounts without sending anything', async () => {
    const response = await api(app).post('/auth/forgot-password', { email: 'ninguem@agroserv.com' }).expect(200);
    expect(response.body.data).toEqual({ message: 'Se o e-mail existir, enviaremos um link.' });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(inbox).toHaveLength(0);
  });

  it('resets the password once and invalidates older links', async () => {
    await api(app).post('/auth/forgot-password', { email: PRODUCER });
    await delivered(1);
    await api(app).post('/auth/forgot-password', { email: PRODUCER });
    const [older, newer] = (await delivered(2)).map(tokenOf);
    const stale = await api(app).post('/auth/reset-password', { token: older, password: 'novasenha1' }).expect(422);
    expect(stale.body.error.fields).toEqual({ token: 'Link inválido ou expirado.' });
    const short = await api(app).post('/auth/reset-password', { token: newer, password: '123' }).expect(422);
    expect(short.body.error.fields).toEqual({ password: 'A senha precisa ter pelo menos 8 caracteres.' });
    const done = await api(app).post('/auth/reset-password', { token: newer, password: 'novasenha1' }).expect(200);
    expect(done.body.data).toEqual({ message: 'Senha redefinida. Entre com a nova senha.' });
    await api(app).post('/auth/login', { email: PRODUCER, password: 'novasenha1' }).expect(200);
    await api(app).post('/auth/reset-password', { token: newer, password: 'outrasenha1' }).expect(422);
  });

  it('sends at most 3 e-mails per account per hour', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await api(app).post('/auth/forgot-password', { email: 'prestador3@agroserv.com' }).expect(200);
    }
    await delivered(3);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(inbox).toHaveLength(3);
  });

  it('expires the link after 60 minutes', async () => {
    await api(app).post('/auth/forgot-password', { email: 'prestador5@agroserv.com' });
    const [mail] = await delivered(1);
    vi.spyOn(app.get(ClockService), 'now').mockReturnValue(new Date(Date.now() + 61 * 60 * 1000));
    await api(app).post('/auth/reset-password', { token: tokenOf(mail), password: 'novasenha1' }).expect(422);
  });

  it('keeps answering 200 when the mail server is down', async () => {
    const { MailService } = await import('../src/services/mail.service.js');
    const mail = app.get(MailService);
    const transporter = (mail as unknown as { transporter: { sendMail: () => Promise<never> } }).transporter;
    vi.spyOn(transporter, 'sendMail').mockRejectedValue(new Error('connection refused'));
    await api(app).post('/auth/forgot-password', { email: 'prestador6@agroserv.com' }).expect(200);
    expect(await mail.send({ to: 'x@agroserv.com', subject: 'Teste', text: 't', html: 't' })).toBe(false);
  });
});
