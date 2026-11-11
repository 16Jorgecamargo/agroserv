import bcrypt from 'bcrypt';
import { AppException } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import type { User } from '../users/entities/user.entity.js';
import { AuthService } from './auth.service.js';

function buildService(user: Partial<User> | null, failedAttempts = 0) {
  const users = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findPasswordHash: vi.fn().mockResolvedValue(bcrypt.hashSync('123456', 4)),
    create: vi.fn().mockImplementation((data: Partial<User>) => Promise.resolve({ id: 'new-1', ...data })),
  };
  const profiles = { create: vi.fn() };
  const attempts = {
    countSince: vi.fn().mockResolvedValue(failedAttempts),
    register: vi.fn(),
    clear: vi.fn(),
  };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const config = { getOrThrow: vi.fn().mockReturnValue(4) };
  const service = new AuthService(
    users as never, profiles as never, attempts as never, jwt as never, config as never, new ClockService(),
  );
  return { service, users, profiles, attempts, jwt };
}

const activeUser: Partial<User> = {
  id: 'usr-1', name: 'Carlos', email: 'produtor@agroserv.com', role: 'producer', status: 'active', city: 'Toledo', state: 'PR',
};

async function errorOf(promise: Promise<unknown>): Promise<AppException> {
  return promise.then(
    () => { throw new Error('expected a rejection'); },
    (error: AppException) => error,
  );
}

describe('AuthService', () => {
  it('signs a minimal token on a correct login', async () => {
    const { service, jwt, attempts } = buildService(activeUser);
    const session = await service.login({ email: 'PRODUTOR@agroserv.com', password: '123456' });
    expect(session.token).toBe('signed-token');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'usr-1', email: 'produtor@agroserv.com', role: 'producer' });
    expect(attempts.clear).toHaveBeenCalledWith('produtor@agroserv.com');
  });

  it('answers with a generic message and records the failed attempt', async () => {
    const { service, attempts } = buildService(activeUser);
    const error = await errorOf(service.login({ email: 'produtor@agroserv.com', password: 'errada' }));
    expect(error.getStatus()).toBe(401);
    expect(error.code).toBe('invalid_credentials');
    expect(attempts.register).toHaveBeenCalled();
  });

  it('tells a suspended account only when the password is right', async () => {
    const { service } = buildService({ ...activeUser, status: 'suspended' });
    const right = await errorOf(service.login({ email: 'produtor@agroserv.com', password: '123456' }));
    expect(right.code).toBe('account_suspended');
    const wrong = await errorOf(service.login({ email: 'produtor@agroserv.com', password: 'errada' }));
    expect(wrong.code).toBe('invalid_credentials');
  });

  it('blocks after too many failed attempts', async () => {
    const { service, users } = buildService(activeUser, 5);
    const error = await errorOf(service.login({ email: 'produtor@agroserv.com', password: '123456' }));
    expect(error.getStatus()).toBe(429);
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it('hashes the password and creates the provider profile on register', async () => {
    const { service, users, profiles } = buildService(null);
    await service.register({
      name: 'Maria', email: 'Maria@Example.com', password: 'segredo123', phone: '(45) 99999-0000',
      city: 'Toledo', state: 'PR', role: 'provider', acceptedTerms: true,
    });
    const saved = users.create.mock.calls[0][0] as User;
    expect(saved.email).toBe('maria@example.com');
    expect(saved.passwordHash).not.toBe('segredo123');
    expect(await bcrypt.compare('segredo123', saved.passwordHash)).toBe(true);
    expect(profiles.create).toHaveBeenCalledWith('new-1');
  });
});
