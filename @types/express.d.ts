import { JWTPayloadInterface } from './$src/modules/auth/interfaces/jwt-payload.interface';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayloadInterface;
    }
  }
}
