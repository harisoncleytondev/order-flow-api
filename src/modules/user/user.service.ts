import { ConflictException, Injectable } from '@nestjs/common';
import { prisma } from '../../lib/prisma';
import { CreateUserDTO } from './dto/create-user-dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  async findOne(email: string) {
    return await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  }

  async create(body: CreateUserDTO) {
    const userExists = await this.findOne(body.email);
    const password = await hash(body.password, 10);

    if (userExists) {
      throw new ConflictException('Usuário já existente.');
    }

    const newUser = await prisma.user.create({
      data: { ...body, password: password },
    });

    return newUser;
  }
}
