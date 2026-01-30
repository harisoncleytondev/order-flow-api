import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '../../lib/prisma';
import { CreateUserDTO } from './dto/create-user-dto';
import { hash } from 'bcrypt';
import { UpdateUserDTO } from './dto/update-user-dto';

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

  async findOneById(id: string) {
    const userExists = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return userExists;
  }

  async create(body: CreateUserDTO) {
    const userExists = await prisma.user.findFirst({
      where: { email: body.email },
    });

    if (userExists) {
      throw new ConflictException('Usuário já existente.');
    }

    const password = await hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: { ...body, password: password },
    });

    return newUser;
  }

  async update(id: string, body: UpdateUserDTO) {
    const userExists = await this.findOneById(id);

    return prisma.user.update({
      where: { id: userExists.id },
      data: body,
    });
  }

  async delete(id: string) {
    const userExists = await this.findOneById(id);

    return prisma.user.update({
      where: { id: userExists.id },
      data: {
        isActive: false,
      },
    });
  }
}
