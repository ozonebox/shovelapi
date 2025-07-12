import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = User & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;

  @Prop({ required: true, unique: true }) emailAddress: string;
  @Prop({ required: true }) password: string;

  @Prop() gender: string;
  @Prop() country: string;
  @Prop() phoneNumber: string;
  @Prop() address: string;
  @Prop() zip: string;
  @Prop() city: string;
  @Prop() state: string;
  @Prop() dateOfBirth: Date;
  @Prop() telegram: string;

  @Prop({ default: 'pending', enum: ['true', 'blocked', 'pending'] })
  isVerified: string;

  @Prop({ default: 0 }) loginCount: number;
  @Prop() hash: string; // OTP or verification code

  @Prop({ default: 0 }) otpCount: number;
  @Prop({ type: Date, default: null })
  otpLastSentAt: Date | null; 

  @Prop() profileUrl: string;
  @Prop() userLevel: string;
  @Prop() refId: number;
  @Prop() blockReason: string;
  @Prop() twoFa: string;

  @Prop({ default: 0 }) balanceUsd: number;
  @Prop({ default: 0 }) balanceBTC: number;
  @Prop({ default: 0 }) balanceETH: number;
  @Prop({ default: 0 }) balanceUSDTERC20: number;
  @Prop({ default: 0 }) balanceUSDTTRC20: number;
  @Prop({ unique: true })
  userMnem: string;
    @Prop({
    type: [
      {
        address: { type: String,  },
        index: { type: Number, },
        addressId: { type: String , },
        currency: { type: String , },
        depositType: { type: String, },
        depositAmount: { type: Number,},
        rate: { type: Number,  },
        depositAmountUsd: { type: Number,  },
        depositAddressQr: { type: String, },
        addressIndex: { type: Number, },
        createdAt: { type: Date, },
      }
    ],
    default: [],
  })
  depositAddress: Array<{
    address: string;
    index: number;
    addressId: string;
    currency: string;
    depositType: string;
    depositAmount: number;
    rate: number;
    depositAmountUsd: number;
    depositAddressQr: string;
    addressIndex: number;
    createdAt: Date;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'depositAddress.address': 1 });
UserSchema.index({ 'depositAddress.depositType': 1 });

UserSchema.pre('save', function (next) {
  if (this.emailAddress) {
    this.emailAddress = this.emailAddress.toLowerCase();
  }

  if (
    !this.userMnem &&
    typeof this.firstName === 'string' &&
    typeof this.lastName === 'string' &&
    this._id
  ) {
    const first3 = this.firstName.slice(0, 3).toLowerCase();
    const last3 = this.lastName.slice(0, 3).toLowerCase();
    const idPart = this._id.toString().slice(-4);
    const timestamp = Date.now();
    const code = Math.floor(100000 + Math.random() * 900000);

    this.userMnem = `${first3}${last3}${idPart}${timestamp}${code}`;
  }

  next();
});
