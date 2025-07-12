
import {  IsEmail,
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
  ValidationArguments } from 'class-validator';

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
export class GetTransactionDto {
@IsOptional()
@IsEmail()
emailAddress?: string;

@IsOptional()
@IsString()
token?: string;

@Validate(RequireEmailOrTokenConstraint)
dummyFieldToTriggerValidation: string = '';

@IsOptional()
@IsString()
custTransactionReference: string;

@IsOptional()
@IsString()
encCustTransactionReference: string;

@IsOptional()
@IsString()
transactionReference?: string;

@IsOptional()
@IsString()
depositAddress?: string;

}
