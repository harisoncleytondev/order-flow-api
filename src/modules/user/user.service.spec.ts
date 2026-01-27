jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { userMock } from '../../testing/user.mock';
import { prisma } from '../../lib/prisma';
import { hash } from 'bcrypt';
import { CreateUserDTO } from './dto/create-user-dto';
import { ConflictException } from '@nestjs/common';

describe('Testes do UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Deve estar definido', () => {
    expect(userService).toBeDefined();
  });

  // Método FindOne

  it('Deve encontrar o usuário', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(userMock);

    const result = await userService.findOne(userMock.email);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: userMock.email },
    });
    expect(result).toEqual(userMock);
  });

  it('Deve lançar erro ao não encontrar o usuário', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await expect(userService.findOne('test@test.com')).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: userMock.email },
    });
  });

  // Método Create

  it('Deve criar o usuário', async () => {
    jest.spyOn(userService, 'findOne').mockResolvedValueOnce(null);
    (hash as jest.Mock).mockResolvedValueOnce('password-hash');
    (prisma.user.create as jest.Mock).mockResolvedValueOnce(userMock);

    const body: CreateUserDTO = {
      email: 'test@test.com',
      name: 'Neymar',
      password: '123',
    };

    const result = await userService.create(body);

    expect(userService.findOne).toHaveBeenCalledWith(body.email);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        ...body,
        password: 'password-hash',
      },
    });

    expect(result).toEqual(userMock);
  });

  it('Deve lançar erro de conflito ao criar o usuário', async () => {
    jest.spyOn(userService, 'findOne').mockResolvedValueOnce(userMock);
    (hash as jest.Mock).mockResolvedValueOnce('password-hash');
    (prisma.user.create as jest.Mock).mockResolvedValueOnce(userMock);

    const body: CreateUserDTO = {
      email: 'test@test.com',
      name: 'Neymar',
      password: '123',
    };

    await expect(userService.create(body)).rejects.toThrow(ConflictException);
  });
});
