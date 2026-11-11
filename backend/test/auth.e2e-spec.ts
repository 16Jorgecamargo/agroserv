import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Service } from '../src/services/entities/service.entity.js';
import { User } from '../src/users/entities/user.entity.js';
import { ADMIN, api, createApp, login, PRODUCER, PROVIDER } from './helpers.js';

const newAccount = {
  name: 'Maria Oliveira',
  email: 'Maria@Example.com',
  password: 'segredo123',
  phone: '(45) 99999-0000',
  city: 'Toledo',
  state: 'PR',
  role: 'provider',
  acceptedTerms: true,
};

describe('auth and account', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in each demo role', async () => {
    for (const [email, role] of [[PRODUCER, 'producer'], [PROVIDER, 'provider'], [ADMIN, 'admin']]) {
      const response = await api(app).post('/auth/login', { email: ` ${email.toUpperCase()} `, password: '123456' }).expect(200);
      expect(response.body.data.user.role).toBe(role);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.token).toEqual(expect.any(String));
    }
  });

  it('rejects missing and wrong credentials', async () => {
    const missing = await api(app).post('/auth/login', { email: PRODUCER }).expect(400);
    expect(missing.body.error).toMatchObject({ code: 'validation_error', message: 'Informe e-mail e senha.' });
    const wrong = await api(app).post('/auth/login', { email: PRODUCER, password: 'errada' }).expect(401);
    expect(wrong.body.error).toMatchObject({ code: 'invalid_credentials', message: 'E-mail ou senha inválidos.' });
  });

  it('blocks login after 5 wrong attempts', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await api(app).post('/auth/login', { email: 'prestador6@agroserv.com', password: 'errada' }).expect(401);
    }
    const blocked = await api(app).post('/auth/login', { email: 'prestador6@agroserv.com', password: '123456' }).expect(429);
    expect(blocked.body.error.code).toBe('too_many_attempts');
  });

  it('requires a valid token on private routes', async () => {
    const response = await api(app).get('/auth/me').expect(401);
    expect(response.body.error).toMatchObject({ code: 'unauthorized', message: 'Sessão inválida. Faça login novamente.' });
    await api(app, 'not-a-token').get('/auth/me').expect(401);
  });

  it('answers 403 when the role cannot use the endpoint', async () => {
    const token = await login(app, PRODUCER);
    const response = await api(app, token).get('/provider/profile').expect(403);
    expect(response.body.error).toMatchObject({ code: 'forbidden', message: 'Você não tem permissão para esta ação.' });
  });

  it('validates the register form with field messages', async () => {
    const response = await api(app).post('/auth/register', { ...newAccount, email: 'x', password: '123', acceptedTerms: false, state: 'XX' }).expect(422);
    expect(response.body.error).toMatchObject({
      code: 'validation_error',
      message: 'Revise os campos destacados.',
      fields: {
        email: 'Informe um e-mail válido.',
        password: 'A senha precisa ter pelo menos 8 caracteres.',
        state: 'Selecione a UF.',
        acceptedTerms: 'Aceite os termos de uso e a política de privacidade.',
      },
    });
    const taken = await api(app).post('/auth/register', { ...newAccount, email: PRODUCER }).expect(422);
    expect(taken.body.error.fields).toEqual({ email: 'Este e-mail já está cadastrado.' });
  });

  it('registers a provider with an empty profile and opens the session', async () => {
    const response = await api(app).post('/auth/register', newAccount).expect(201);
    const { token, user } = response.body.data;
    expect(user).toMatchObject({ email: 'maria@example.com', role: 'provider', phone: '45999990000', status: 'active' });
    const profile = await api(app, token).get('/provider/profile').expect(200);
    expect(profile.body.data).toMatchObject({
      document: '', serviceRadiusKm: 50, yearsOfExperience: 0, description: '', verificationStatus: 'not_sent', rating: 0, reviewCount: 0,
    });
  });

  it('updates profile data and the provider profile', async () => {
    const token = await login(app, PROVIDER);
    const me = await api(app, token).patch('/me', { name: 'Agro Máquinas PR', phone: '45 3333-4444' }).expect(200);
    expect(me.body.data).toMatchObject({ name: 'Agro Máquinas PR', phone: '4533334444' });
    const invalid = await api(app, token).patch('/provider/profile', { serviceRadiusKm: 900, document: '123' }).expect(422);
    expect(invalid.body.error.fields).toEqual({
      document: 'Informe um CPF ou CNPJ válido.', serviceRadiusKm: 'Informe um raio entre 1 e 500 km.',
    });
    const changed = await api(app, token).patch('/provider/profile', { document: '111.222.333-44' }).expect(200);
    expect(changed.body.data).toMatchObject({ document: '11122233344', verificationStatus: 'not_sent' });
  });

  it('changes the password asking for the current one', async () => {
    const token = await login(app, 'prestador5@agroserv.com');
    const wrong = await api(app, token).patch('/me/password', { currentPassword: 'errada', newPassword: 'novasenha1' }).expect(422);
    expect(wrong.body.error.fields).toEqual({ currentPassword: 'Senha atual incorreta.' });
    const same = await api(app, token).patch('/me/password', { currentPassword: '123456', newPassword: '123456' }).expect(422);
    expect(same.body.error.fields.newPassword).toBe('A senha precisa ter pelo menos 8 caracteres.');
    await api(app, token).patch('/me/password', { currentPassword: '123456', newPassword: 'novasenha1' }).expect(200);
    await api(app).post('/auth/login', { email: 'prestador5@agroserv.com', password: 'novasenha1' }).expect(200);
  });

  it('blocks account deletion with open requests and for admins', async () => {
    const producer = await login(app, PRODUCER);
    const blocked = await api(app, producer).delete('/me').expect(409);
    expect(blocked.body.error).toMatchObject({
      code: 'conflict', message: 'Você tem solicitações em andamento. Conclua ou cancele antes de excluir a conta.',
    });
    await api(app, await login(app, ADMIN)).delete('/me').expect(403);
  });

  it('soft deletes an account, frees the e-mail and hides its services', async () => {
    const token = await login(app, 'prestador4@agroserv.com');
    const response = await api(app, token).delete('/me').expect(200);
    expect(response.body.data).toEqual({ message: 'Conta excluída.' });
    await api(app, token).get('/auth/me').expect(401);
    await api(app).post('/auth/login', { email: 'prestador4@agroserv.com', password: '123456' }).expect(401);
    const dataSource = app.get(DataSource);
    const user = await dataSource.getRepository(User).findOneByOrFail({ id: 'prv-4' });
    expect(user).toMatchObject({ status: 'deleted', name: 'Transportes Vale Verde' });
    const service = await dataSource.getRepository(Service).findOneByOrFail({ id: 'svc-6' });
    expect(service).toMatchObject({ status: 'hidden', hiddenReason: 'Conta excluída', statusBeforeHidden: 'active' });
    await api(app).post('/auth/register', { ...newAccount, email: 'prestador4@agroserv.com' }).expect(201);
  });
});
