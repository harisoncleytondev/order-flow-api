import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const RolesKey = 'roles';
export const Roles = (...args: UserRole[]) => SetMetadata('roles', args);
