
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DecryptTransactionDto {

  @IsNotEmpty()
  encrypted: any;


}
