export interface AppConfig {
  port: number;
  databasePath: string;
  synchronize: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  publicUrl: string;
  frontendUrl: string;
  uploadDir: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  bcryptRounds: number;
  seedOnStart: boolean;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  // Lê uma variável booleana do ambiente
  return value === undefined ? fallback : value === 'true';
}

export function loadConfig(): AppConfig {
  // Reúne as variáveis de ambiente com os valores padrão de desenvolvimento
  const env = process.env;
  const port = Number(env.PORT ?? 3333);
  const isTest = env.NODE_ENV === 'test';
  const smtpPort = Number(env.SMTP_PORT ?? 587);
  return {
    port,
    databasePath: env.DATABASE_PATH ?? (isTest ? ':memory:' : 'data/agroserv.sqlite'),
    synchronize: flag(env.DB_SYNCHRONIZE, env.NODE_ENV !== 'production'),
    jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '7d',
    corsOrigin: env.CORS_ORIGIN ?? '*',
    publicUrl: env.PUBLIC_URL ?? `http://localhost:${port}`,
    frontendUrl: env.FRONTEND_URL ?? 'http://localhost:5173',
    uploadDir: env.UPLOAD_DIR ?? (isTest ? 'node_modules/.tmp/test-uploads' : 'uploads'),
    smtpHost: env.SMTP_HOST ?? '',
    smtpPort,
    smtpSecure: flag(env.SMTP_SECURE, smtpPort === 465),
    smtpUser: env.SMTP_USER ?? '',
    smtpPass: env.SMTP_PASS ?? '',
    mailFrom: env.MAIL_FROM ?? `AgroServ <${env.SMTP_USER || 'no-reply@agroserv.local'}>`,
    bcryptRounds: Number(env.BCRYPT_ROUNDS ?? (isTest ? 4 : 10)),
    seedOnStart: flag(env.SEED_ON_START, true),
  };
}
