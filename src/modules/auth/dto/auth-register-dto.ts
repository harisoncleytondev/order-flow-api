import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthRegisterDTO {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(16)
  password: string;
}
