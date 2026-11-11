import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  // Cria a aplicação e lê a configuração
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.getOrThrow<string>('corsOrigin');

  // Headers de segurança e CORS liberado para o front-end
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: origin === '*' ? true : origin.split(',') });

  // Sobe o servidor na porta configurada
  await app.listen(config.getOrThrow<number>('port'));
}
await bootstrap();
