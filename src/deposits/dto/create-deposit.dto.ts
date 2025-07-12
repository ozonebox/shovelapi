import { IsEmail, IsNotEmpty, IsNumber, IsPositive, IsEnum } from 'class-validator';

export enum DepositType {
  BTC = 'BTC',
  ETH = 'ETH',
  LTC = 'LTC',
  USDT_ERC = 'USDTERC20',
  USDT_TRC = 'USDTTRC20',
  SOL = 'SOL',
  BCH = 'BCH',
  XRP = 'XRP',
}
export class CreateDepositDto {

  @IsEmail()
  emailAddress: string;

  @IsEnum(DepositType, { message: 'depositType must be one of BTC, ETH, LTC, USDTERC20, USDTTRC20' })
  depositType: DepositType;

  @IsNumber()
  @IsPositive()
  depositAmount: number;
}
