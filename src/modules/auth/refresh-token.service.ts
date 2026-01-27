import { Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '../../lib/prisma';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { JWTPayloadInterface } from './interfaces/jwt-payload.interface';
import { UserService } from '../user/user.service';
import { compare, hash } from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async create(user: User) {
    const payload = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        { expiresIn: '10m' },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        { expiresIn: '30d' },
      ),
    ]);

    const lastToken = await prisma.refreshToken.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastToken) {
      await prisma.refreshToken.update({
        where: { id: lastToken.id },
        data: { revokedAt: new Date() },
      });
    }

    const tokenHash = await hash(refreshToken, 10);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60),
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload =
        await this.jwtService.verifyAsync<JWTPayloadInterface>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.userService.findOne(payload.email);

      const tokenStored = await prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenStored) {
        throw new UnauthorizedException('Token inválido');
      }

      const isValid = await compare(refreshToken, tokenStored.tokenHash);

      if (!isValid) {
        throw new UnauthorizedException('Token inválido');
      }

      await prisma.refreshToken.update({
        where: { id: tokenStored.id },
        data: { revokedAt: new Date() },
      });

      return await this.create(user);
    } catch {
      throw new UnauthorizedException('RefreshToken inválido');
    }
  }
}
