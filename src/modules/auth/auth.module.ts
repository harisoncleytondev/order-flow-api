import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { UserModule } from '../user/user.module';
import { AuthGuard } from '../../guard/auth/auth.guard';

@Module({
  imports: [
    JwtModule.register({
      global: false,
      secret: process.env.JWT_SECRET,
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, RefreshTokenService],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
