import { UserRole } from '@prisma/client';

export const userMock = {
  id: 'uuid-1234-5678-90ab-cdef12345678',
  email: 'test@test.com',
  name: 'Harison Tester',
  password: 'hashed_password',
  role: UserRole.CUSTOMER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokens: [],
  orders: [],
  auditLogs: [],
  notifications: [],
};
