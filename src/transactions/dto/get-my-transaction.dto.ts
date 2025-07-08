
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GetMyTransactionDto {

  @IsEmail()
  emailAddress: string;


}
