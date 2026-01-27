export interface JWTPayloadInterface {
  type: 'access' | 'refresh';
  name: string;
  email: string;
  role: 'SYSTEM' | 'CUSTOMER' | 'ADMIN';
  exp?: number;
  iat?: number;
}
