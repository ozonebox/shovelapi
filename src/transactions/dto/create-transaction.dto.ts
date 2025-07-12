import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsString,
  IsOptional,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';

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

// Custom constraint to enforce email or token
@ValidatorConstraint({ name: 'RequireEmailOrToken', async: false })
class RequireEmailOrTokenConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    return !!(obj.emailAddress || obj.token); // valid if either exists
  }

  defaultMessage(args: ValidationArguments) {
    return 'Either emailAddress or token must be provided.';
  }
}

export class CreateTransactionDto {
  @IsOptional()
  @IsEmail()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @Validate(RequireEmailOrTokenConstraint)
  dummyFieldToTriggerValidation: string = ''; // dummy field to attach the custom validator

  @IsNotEmpty()
  @IsString()
  custTransactionReference: string;

  @IsNotEmpty()
  @IsString()
  encCustTransactionReference: string;

  @IsNotEmpty()
  @IsString()
  paymentName: string;

  @IsOptional()
  @IsString()
  paymentImageUrl?: string;

  @IsEnum(DepositType, {
    message: 'depositType must be one of BTC, ETH, LTC, USDTERC20, USDTTRC20, SOL, BCH',
  })
  depositType: DepositType;

  @IsNumber()
  @IsPositive()
  depositAmountUsd: number;
}
