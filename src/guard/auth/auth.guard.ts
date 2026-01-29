import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { RolesKey } from '../../decorators/roles/roles.decorator';
import { JWTPayloadInterface } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      RolesKey,
      context.getHandler(),
    );

    const request: Request = context.switchToHttp().getRequest();

    const accessToken = request.cookies?.accessToken as string;
    if (!accessToken) {
      throw new UnauthorizedException('Token não encontrado');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JWTPayloadInterface>(accessToken);
      if (payload) {
        request.user = payload;
        if (!requiredRoles || requiredRoles.includes(payload.role)) {
          return true;
        }

        return false;
      }

      return false;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
