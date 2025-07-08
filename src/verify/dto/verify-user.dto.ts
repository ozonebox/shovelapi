import { Optional } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsEmail()
  emailAddress: string;
  @IsString()
  authKey: string;
}