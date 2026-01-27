import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { prisma } from '../src/lib/prisma';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import { User } from '@prisma/client';

describe('Auth - Teste de ponta a ponta', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.use(cookieParser());

    await app.init();
    await prisma.user.deleteMany();
  });

  const payload = {
    email: 'teste@email.com',
    name: 'João',
    password: '12345678',
  };

  // Rotas /AUTH/REGISTER

  it('/auth/register (POST - 201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    const body = response.body as User;
    expect(body.email).toEqual(payload.email);

    await prisma.user.deleteMany();
  });

  it('/auth/register (POST - 409)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    const body = response.body as User;
    expect(body.email).toEqual(payload.email);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(409);
  });

  // Rotas /AUTH/LOGIN

  it('/auth/login (POST - 200)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const cookies = response.headers['set-cookie'];

    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('accessToken=');
    expect(cookies[1]).toContain('refreshToken=');
  });

  it('/auth/login (POST - 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: '12121112' })
      .expect(401);
  });

  // Rotas /AUTH/LOGIN

  it('/auth/refresh (POST - 200)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[1]).toContain('refreshToken=');

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookies[1])
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body).toHaveProperty('refreshToken');

    const newCookies = response.headers['set-cookie'];

    expect(newCookies).toBeDefined();
    expect(newCookies[0]).toContain('accessToken=');
    expect(newCookies[1]).toContain('refreshToken=');
  });

  it('/auth/refresh (POST - 401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[1]).toContain('refreshToken=');

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=algumacoisaksaksakaskask')
      .expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
