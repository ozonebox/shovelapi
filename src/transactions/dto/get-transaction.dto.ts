
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GetTransactionDto {

  @IsEmail()
  emailAddress: string;

  @IsOptional()
  @IsString()
  custTransactionReference: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  depositAddress?: string;

}
