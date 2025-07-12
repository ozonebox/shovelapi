import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {


  @Prop({ index: true, unique: true, })
  encCustTransactionReference: string; 

 @Prop({ unique: true, index: true })
  custTransactionReference: string; 
  
  @Prop({ unique: true, index: true })
  transactionReference: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  depositAmountUsd: number;

  @Prop()
  depositAmount: number;s

  @Prop()
  rate: number;

  @Prop({ required: true, enum: ['BTC', 'ETH', 'LTC', 'USDTERC20', 'USDTTRC20', 'SOL', 'BCH', 'XRP'], index: true })
  depositType: string;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'failed', 'expired'], index: true })
  status: string;


  @Prop({
    type: [
      {
        address: { type: String, required: true },
        index: { type: Number, required: true },
        addressId: { type: String ,required: true },
        currency: { type: String ,required: true },
        depositType: { type: String,required: true  },
        depositAmount: { type: Number, required: true },
        rate: { type: Number, required: true },
        depositAmountUsd: { type: Number, required: true },
        depositAddressQr: { type: String, required: true },
        addressIndex: { type: Number, required: true },
        createdAt: { type: Date, required: true },
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

  @Prop()
  paymentName: string;

  @Prop()
  paymentImageUrl: string;

  
  @Prop({ default: null, index: true })
  confirmedAt?: Date;

  @Prop({ default: null, })
  transDate?: string;

  @Prop({ default: 0 })
  amountUsd: number;

  @Prop({ default: 'Deposit Request Initiated' })
  statusDesc: string;

  @Prop({ default: '0' })
  charges: string;

  @Prop({ default: 'Auto Deposit' })
  msg: string;

  @Prop()
  paymentLink: string;


 @Prop({
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  })
  expiresIn?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ 'depositAddress.address': 1 });
TransactionSchema.index({ 'depositAddress.depositType': 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ confirmedAt: -1 }); 
TransactionSchema.index({ status: 1, confirmedAt: -1 });
TransactionSchema.index(
  {
    'depositAddress.address': 1,
    'depositAddress.depositType': 1
  },
  { unique: true, sparse: true }
);

TransactionSchema.pre('save', function (next) {
  if (this.isNew && !this.transactionReference  && this._id) {
    const idPart = this._id.toString().slice(-4);
    const timestamp = Date.now();
    const code = Math.floor(100000 + Math.random() * 900000);
    this.transactionReference = `${idPart}${timestamp}${code}`;
  }
  next();
});
