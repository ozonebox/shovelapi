import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class VerifyUserCompleteDto {
  @IsEmail()
  emailAddress: string;

  @IsNotEmpty()
  otp: string;

  @IsNotEmpty()
  authKey: string;
}
