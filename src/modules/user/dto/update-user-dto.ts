import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUserDTO } from './create-user-dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDTO extends PartialType(CreateUserDTO) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
