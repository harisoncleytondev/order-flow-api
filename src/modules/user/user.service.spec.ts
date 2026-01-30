jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { userMock } from '../../testing/user.mock';
import { prisma } from '../../lib/prisma';
import { hash } from 'bcrypt';
import { CreateUserDTO } from './dto/create-user-dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateUserDTO } from './dto/update-user-dto';

describe('Testes do UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
      NotFoundException,
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

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        ...body,
        password: 'password-hash',
      },
    });

    expect(result).toEqual(userMock);
  });

  it('Deve lançar erro de conflito ao criar o usuário', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(userMock);
    (hash as jest.Mock).mockResolvedValueOnce('password-hash');
    (prisma.user.create as jest.Mock).mockResolvedValueOnce(userMock);

    const body: CreateUserDTO = {
      email: 'test@test.com',
      name: 'Neymar',
      password: '123',
    };

    await expect(userService.create(body)).rejects.toThrow(ConflictException);
  });

  // Método Update

  it('Deve atualizar o usuário', async () => {
    jest.spyOn(userService, 'findOneById').mockResolvedValueOnce(userMock);

    (prisma.user.update as jest.Mock).mockResolvedValueOnce({
      ...userMock,
      name: 'Nome Atualizado',
    });

    const body: UpdateUserDTO = {
      name: 'Nome Atualizado',
    };

    const result = await userService.update(userMock.id, body);

    expect(userService.findOneById).toHaveBeenCalledWith(userMock.id);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userMock.id },
      data: body,
    });

    expect(result.name).toBe('Nome Atualizado');
  });

  it('Deve lançar erro ao tentar atualizar usuário inexistente', async () => {
    jest
      .spyOn(userService, 'findOneById')
      .mockRejectedValueOnce(new NotFoundException('Usuário não encontrado'));

    const body: UpdateUserDTO = {
      name: 'Teste',
    };

    await expect(userService.update('id-inexistente', body)).rejects.toThrow(
      NotFoundException,
    );

    expect(userService.findOneById).toHaveBeenCalledWith('id-inexistente');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // Método Delete

  it('Deve desativar o usuário (soft delete)', async () => {
    jest.spyOn(userService, 'findOneById').mockResolvedValueOnce(userMock);
    (prisma.user.update as jest.Mock).mockResolvedValueOnce({
      ...userMock,
      isActive: false,
    });

    const result = await userService.delete(userMock.id);

    expect(userService.findOneById).toHaveBeenCalledWith(userMock.id);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userMock.id },
      data: { isActive: false },
    });

    expect(result.isActive).toBe(false);
  });

  it('Deve lançar erro ao tentar deletar usuário inexistente', async () => {
    jest
      .spyOn(userService, 'findOneById')
      .mockRejectedValueOnce(new NotFoundException('Conta não encontrada.'));

    await expect(userService.delete('id-invalido')).rejects.toThrow(
      NotFoundException,
    );
  });
});
