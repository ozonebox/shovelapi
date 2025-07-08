import { IsEmail } from 'class-validator';

export class ResetAccountDto {
  @IsEmail()
  emailAddress: string;
}