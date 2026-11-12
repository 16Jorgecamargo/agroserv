import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

export const PRODUCER = 'produtor@agroserv.com';
export const PROVIDER = 'prestador@agroserv.com';
export const ADMIN = 'admin@agroserv.com';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

export async function login(app: INestApplication, email: string, password = '123456'): Promise<string> {
  const response = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
  return response.body.data.token as string;
}

export function api(app: INestApplication, token?: string) {
  const send = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string, body?: object) => {
    const call = request(app.getHttpServer())[method](path);
    if (token) void call.set('Authorization', `Bearer ${token}`);
    return body ? call.send(body) : call;
  };
  return {
    get: (path: string) => send('get', path),
    post: (path: string, body?: object) => send('post', path, body),
    patch: (path: string, body?: object) => send('patch', path, body),
    put: (path: string, body?: object) => send('put', path, body),
    delete: (path: string) => send('delete', path),
  };
}
