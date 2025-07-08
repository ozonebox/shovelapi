import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class ResetAccountCompleteDto {
   @IsEmail()
    emailAddress: string;
  
    @IsNotEmpty()
    otp: string;
  
    @IsNotEmpty()
    authKey: string;
  
    @MinLength(6)
    password: string;
  
    @IsNotEmpty()
    passwordConfirm: string;
}