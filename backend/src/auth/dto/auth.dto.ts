import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterUser {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  firstname: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password: string;
}

export class LoginDto {
  @IsString()
  password: string;

  @IsString()
  username: string;
}
