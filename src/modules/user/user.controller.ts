import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../guard/auth/auth.guard';
import { Roles } from '../../decorators/roles/roles.decorator';
import { UserRole } from '@prisma/client';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user-dto';
import { UpdateUserDTO } from './dto/update-user-dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return await this.userService.findOneById(id);
  }

  @Post('/create')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() body: CreateUserDTO) {
    return await this.userService.create(body);
  }

  @Put('/update/:id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() body: UpdateUserDTO) {
    return await this.userService.update(id, body);
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}
