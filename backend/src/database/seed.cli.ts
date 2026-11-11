import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from './seed.service.js';

async function run(): Promise<void> {
  // Sobe só o contexto da aplicação, sem servidor HTTP
  const app = await NestFactory.createApplicationContext(AppModule);

  // Recria o banco com os dados demo e encerra
  await app.get(SeedService).reset();
  await app.close();
}
await run();
