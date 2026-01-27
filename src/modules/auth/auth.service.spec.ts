jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RefreshTokenService } from './refresh-token.service';
import { userMock } from '../../testing/user.mock';
import { compare } from 'bcrypt';
import { AuthRegisterDTO } from './dto/auth-register-dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let refreshService: jest.Mocked<RefreshTokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            create: jest.fn(),
            refresh: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    refreshService = module.get(RefreshTokenService);
  });

  it('Deve estar definido', () => {
    expect(authService).toBeDefined();
  });

  // Método Login

  it('Deve realizar login do usuário', async () => {
    (userService.findOne as jest.Mock).mockResolvedValueOnce(userMock);
    (compare as jest.Mock).mockResolvedValueOnce(true);
    (refreshService.create as jest.Mock).mockResolvedValueOnce({
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
    });

    const result = await authService.auth({
      email: 'test@test.com',
      password: 'hashed_password',
    });

    expect(userService.findOne).toHaveBeenCalledWith('test@test.com');
    expect(compare).toHaveBeenCalledWith('hashed_password', userMock.password);
    expect(refreshService.create).toHaveBeenCalledWith(userMock);

    expect(result).toEqual({
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
    });
  });

  it('Deve lançar exceção ao tentar login com senha incorreta', async () => {
    (userService.findOne as jest.Mock).mockResolvedValueOnce(userMock);
    (compare as jest.Mock).mockResolvedValueOnce(false);

    const promise = authService.auth({
      email: 'test@test.com',
      password: 'wrong_password',
    });

    await expect(promise).rejects.toThrow(UnauthorizedException);

    expect(userService.findOne).toHaveBeenCalledWith('test@test.com');
  });

  // Método Register

  it('Deve registrar o usuário', async () => {
    (userService.create as jest.Mock).mockResolvedValueOnce(userMock);
    (refreshService.create as jest.Mock).mockResolvedValueOnce({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const body: AuthRegisterDTO = {
      email: 'test@test.com',
      name: 'name',
      password: '123',
    };

    const result = await authService.register(body);

    expect(userService.create).toHaveBeenCalledWith(body);
    expect(refreshService.create).toHaveBeenCalledWith(userMock);
    expect(result).toEqual({
      user: userMock,
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });
});
