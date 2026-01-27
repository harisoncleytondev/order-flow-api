import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthLoginDTO } from './dto/auth-login-dto';
import { AuthRegisterDTO } from './dto/auth-register-dto';
import { compare } from 'bcrypt';
import { UserService } from '../user/user.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private refreshService: RefreshTokenService,
  ) {}

  async auth(body: AuthLoginDTO) {
    const user = await this.userService.findOne(body.email);

    if (!user) {
      throw new UnauthorizedException('Informações não coincidem');
    }

    const passwordIsValid = await compare(body.password, user.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Informações não coincidem');
    }

    const { accessToken, refreshToken } =
      await this.refreshService.create(user);

    return { accessToken, refreshToken };
  }

  async register(body: AuthRegisterDTO) {
    const user = await this.userService.create(body);
    const { accessToken, refreshToken } =
      await this.refreshService.create(user);

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    return this.refreshService.refresh(refreshToken);
  }
}
