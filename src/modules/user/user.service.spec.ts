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

describe('UserService Tests', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should be defined', () => {
    expect(userService).toBeDefined();
  });

  // Método FindOne

  it('Should find user', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(userMock);

    const result = await userService.findOne(userMock.email);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: userMock.email },
    });
    expect(result).toEqual(userMock);
  });

  it('Should error not found find user', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await expect(userService.findOne('test@test.com')).rejects.toThrow(
      'Usuário não encontrado',
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: userMock.email },
    });
  });

  // Método Create

  it('Should create user', async () => {
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

  it('Should error conflict create user', async () => {
    jest.spyOn(userService, 'findOne').mockResolvedValueOnce(userMock);
    (hash as jest.Mock).mockResolvedValueOnce('password-hash');
    (prisma.user.create as jest.Mock).mockResolvedValueOnce(userMock);

    const body: CreateUserDTO = {
      email: 'test@test.com',
      name: 'Neymar',
      password: '123',
    };

    await expect(userService.create(body)).rejects.toThrow(
      'Usuário já existente.',
    );
  });
});
