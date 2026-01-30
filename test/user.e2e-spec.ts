import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { prisma } from '../src/lib/prisma';
import request from 'supertest';
import { hash } from 'bcrypt';

describe('User - Teste de ponta a ponta', () => {
  let app: INestApplication;

  let userAdmin = {
    email: 'admin@admin.com',
    name: 'admin',
    password: '121212121',
    role: UserRole.ADMIN,
  };

  const payload = {
    email: 'teste@email.com',
    name: 'João',
    password: '12345678',
  };

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
    const passHash = await hash('12345678', 10);
    userAdmin = {
      email: 'admin@admin.com',
      name: 'admin',
      password: passHash,
      role: UserRole.ADMIN,
    };

    await prisma.user.create({
      data: userAdmin,
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: userAdmin,
    });
  });

  // Create

  it('Deve criar um usuário.', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAdmin.email, password: '12345678' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    const body = response.body as User;
    expect(body.email).toEqual(payload.email);
  });

  it('Deve gerar erro ao criar usuário duplicado.', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAdmin.email, password: '12345678' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(409);
  });

  // findOne
  it('Deve achar o usuário pelo ID.', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAdmin.email, password: '12345678' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    const body = response.body as User;

    const search = await request(app.getHttpServer())
      .get(`/user/${body.id}`)
      .set('Cookie', cookies)
      .send(payload)
      .expect(200);

    const bodySearch = search.body as User;

    expect(bodySearch.id).toEqual(body.id);
  });

  // update
  it('Deve atualizar um usuário pelo ID.', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAdmin.email, password: '12345678' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    const createResponse = await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    const user = createResponse.body as User;

    const payloadUpdate = {
      name: 'Usuario Atualizado',
      isActive: false,
    };

    const updateResponse = await request(app.getHttpServer())
      .put(`/user/update/${user.id}`)
      .set('Cookie', cookies)
      .send(payloadUpdate)
      .expect(200);

    const updatedUser = updateResponse.body as User;

    expect(updatedUser.id).toEqual(user.id);
    expect(updatedUser.name).toEqual(payloadUpdate.name);
    expect(updatedUser.isActive).toEqual(payloadUpdate.isActive);
    expect(updatedUser.email).toEqual(payload.email);
  });

  it('Deve deletar (inativar) um usuário pelo ID.', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAdmin.email, password: '12345678' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    const createResponse = await request(app.getHttpServer())
      .post('/user/create')
      .set('Cookie', cookies)
      .send(payload)
      .expect(201);

    const user = createResponse.body as User;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/user/delete/${user.id}`)
      .set('Cookie', cookies)
      .expect(200);

    const deletedUser = deleteResponse.body as User;

    expect(deletedUser.id).toEqual(user.id);
    expect(deletedUser.email).toEqual(user.email);
    expect(deletedUser.isActive).toBe(false);

    const getResponse = await request(app.getHttpServer())
      .get(`/user/${user.id}`)
      .set('Cookie', cookies)
      .expect(200);

    const fetchedUser = getResponse.body as User;
    expect(fetchedUser.isActive).toBe(false);
  });
});
