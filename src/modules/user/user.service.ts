import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '../../lib/prisma';
import { CreateUserDTO } from './dto/create-user-dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  async findOne(email: string) {
    const userExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return userExists;
  }

  async create(body: CreateUserDTO) {
    const userExists = await this.findOne(body.email);

    if (userExists) {
      throw new ConflictException('Usuário já existente.');
    }

    const password = await hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: { ...body, password: password },
    });

    return newUser;
  }
}
