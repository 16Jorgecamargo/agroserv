import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('base', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps success responses in the envelope', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('answers unknown routes with route_not_found', async () => {
    const response = await request(app.getHttpServer()).get('/nope').expect(404);
    expect(response.body).toEqual({
      success: false,
      error: { status: 404, code: 'route_not_found', message: 'Rota não encontrada.' },
    });
  });
});
