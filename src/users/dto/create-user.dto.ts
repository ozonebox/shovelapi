import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  emailAddress: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  country: string;

  @IsOptional() gender?: string;
  @IsOptional() phoneNumber?: string;
  @IsOptional() address?: string;
  @IsOptional() zip?: string;
  @IsOptional() city?: string;
  @IsOptional() state?: string;
  @IsOptional() dateOfBirth?: string;
  @IsOptional() telegram?: string;
}
