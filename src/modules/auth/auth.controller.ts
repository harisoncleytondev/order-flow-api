import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDTO } from './dto/auth-login-dto';
import { AuthRegisterDTO } from './dto/auth-register-dto';
import type { CookieOptions, Request, Response } from 'express';
import { AuthGuard } from '../../guard/auth/auth.guard';
import { JwtPayload } from '../../decorators/user/jwt.decorator';
import type { JWTPayloadInterface } from './interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private authServices: AuthService) {}

  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: false, // codigo n precisa ir pra produção.
  };

  private setCookies(accessToken: string, refreshToken: string, res: Response) {
    res.cookie('accessToken', accessToken, {
      ...this.cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...this.cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('/login')
  async auth(
    @Body() body: AuthLoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authServices.auth(body);

    this.setCookies(accessToken, refreshToken, res);

    res.status(200);
    return { message: 'Login realizado com sucesso!' };
  }

  @Post('/register')
  async register(
    @Body() body: AuthRegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authServices.register(body);

    this.setCookies(accessToken, refreshToken, res);

    return user;
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as {
      refreshToken?: string;
    };

    const { refreshToken: refreshTokenFromCookie } = cookies;

    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authServices.refresh(refreshTokenFromCookie);

    this.setCookies(accessToken, newRefreshToken, res);

    res.status(200);
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  @Get('/logout')
  @UseGuards(AuthGuard)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @JwtPayload() payload: JWTPayloadInterface,
  ) {
    await this.authServices.logout(payload.email);

    res.clearCookie('accessToken', this.cookieOptions);
    res.clearCookie('refreshToken', this.cookieOptions);

    return { message: 'Logout realizado com sucesso' };
  }
}
