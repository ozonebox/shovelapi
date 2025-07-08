import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {

 @Prop({ unique: true, index: true })
  custTransactionReference: string; 
  
  @Prop({ unique: true, index: true })
  transactionReference: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop()
  addressId: string;

  @Prop()
  addressIndex: number;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({ required: true, enum: ['BTC', 'ETH', 'LTC', 'USDTERC20', 'USDTTRC20', 'SOL', 'BCH'], index: true })
  depositType: string;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'failed', 'expired'], index: true })
  status: string;

  @Prop({  index: true })
  depositAddress: string;

  @Prop()
  paymentName: string;

  @Prop()
  paymentImageUrl: string;

  @Prop()
  network: string;
  
  @Prop({ default: null, index: true })
  confirmedAt?: Date;

  @Prop({ default: null, })
  transDate?: string;

  @Prop({ default: 0 })
  amountUsd: number;

  @Prop({ default: 0 })
  ccyAmount: number;

  @Prop({ default: 0 })
  ccyValue: number;

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

TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ depositAddress: 1 });
TransactionSchema.index({ confirmedAt: -1 }); 
TransactionSchema.index({ status: 1, confirmedAt: -1 });


TransactionSchema.pre('save', function (next) {
  if (this.isNew && !this.transactionReference  && this._id) {
    const idPart = this._id.toString().slice(-4);
    const timestamp = Date.now();
    const code = Math.floor(100000 + Math.random() * 900000);
    this.transactionReference = `${idPart}${timestamp}${code}`;
  }
  next();
});
