import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JWTPayloadInterface } from 'src/modules/auth/interfaces/jwt-payload.interface';

export const JwtPayload = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();

    return request.user as JWTPayloadInterface;
  },
);
