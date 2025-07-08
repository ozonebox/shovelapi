
import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsEnum, isString, IsString, IsOptional } from 'class-validator';

export enum DepositType {
  BTC = 'BTC',
  ETH = 'ETH',
  LTC = 'LTC',
  USDT_ERC = 'USDTERC20',
  USDT_TRC = 'USDTTRC20',
  SOL= 'SOL',
  BCH = 'BCH',
}
export class CreateTransactionDto {

  @IsEmail()
  emailAddress: string;

  @IsNotEmpty()
  @IsString()
  custTransactionReference: string;

  @IsNotEmpty()
  @IsString()
  paymentName: string;

   @IsOptional()
  @IsString()
  paymentImageUrl: string;

  @IsEnum(DepositType, { message: 'depositType must be one of btc, eth, ltc, usdterc, usdttrc' })
  depositType: DepositType;

  @IsNumber()
  @IsPositive()
  depositAmount: number;
}
