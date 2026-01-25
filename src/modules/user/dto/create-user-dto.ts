import { IsEmail, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;
}
