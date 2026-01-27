jest.mock('../../lib/prisma', () => ({
  prisma: {
    refreshToken: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { prisma } from '../../lib/prisma';
import { userMock } from '../../testing/user.mock';
import { compare, hash } from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshTokenService', () => {
  let refreshService: RefreshTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    refreshService = module.get(RefreshTokenService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
  });

  it('Deve estar definido', () => {
    expect(refreshService).toBeDefined();
  });

  // Método Create

  it('Deve criar o token', async () => {
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await refreshService.create(userMock);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(prisma.refreshToken.findFirst).toHaveBeenCalled();

    expect(hash).toHaveBeenCalledWith('refresh-token', 10);
    const tokenHash = hash('refresh-token', 10);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        userId: userMock.id,
        tokenHash: tokenHash,
        expiresAt: expect.any(Date),
      },
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('Deve revogar o token anterior e criar um novo token com hash', async () => {
    const oldTokenMock = { id: 'old-id', revokedAt: null };
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(
      oldTokenMock,
    );
    (hash as jest.Mock).mockResolvedValue('hashed-token');

    await refreshService.create(userMock);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'old-id' },
      data: { revokedAt: expect.any(Date) },
    });

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: 'hashed-token',
        }),
      }),
    );
  });

  // Método Refresh

  it('Deve renovar o token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      type: 'refresh',
      email: userMock.email,
    });

    (userService.findOne as jest.Mock).mockResolvedValue(userMock);

    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
      id: 'refresh-token-id',
      tokenHash: 'hash-token',
      userId: userMock.id,
      revokedAt: null,
    });

    (compare as jest.Mock).mockResolvedValue(true);

    jest.spyOn(refreshService, 'create').mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await refreshService.refresh('refresh-token');

    expect(jwtService.verifyAsync as jest.Mock).toHaveBeenCalledWith(
      'refresh-token',
    );

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh-token-id' },
      data: { revokedAt: expect.any(Date) },
    });

    expect(refreshService.create).toHaveBeenCalledWith(userMock);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('Deve lançar erro se o tipo do token não for "refresh" (ex: token de acesso)', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-id',
      email: 'test@mail.com',
      type: 'access',
    });

    await expect(
      refreshService.refresh('token_valido_mas_tipo_errado'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('Deve lançar erro se o token for válido, mas não for encontrado ou estiver revogado no banco', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      email: 'user@mail.com',
      type: 'refresh',
    });

    (userService.findOne as jest.Mock).mockResolvedValue(userMock);

    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(refreshService.refresh('token-revogado')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
