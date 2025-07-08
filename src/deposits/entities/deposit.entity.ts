import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/wallets/entities/address.entity';

export type DepositDocument = Deposit & Document;

@Schema({ timestamps: true })
export class Deposit {
  @Prop({ type: Types.ObjectId, ref: Transaction.name ,index: true })
  transactionId: Types.ObjectId;
    
  @Prop({ required: true,index: true })
  custTransactionReference: string; 

  @Prop({ index: true })
  transactionReference: string;

  @Prop({ unique: true, index: true })
  depositReference: string;
  

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  addressId: string;

  @Prop({ required: true })
  addressIndex: number;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({ required: true, enum: ['BTC', 'ETH', 'LTC', 'USDTERC20', 'USDTTRC20', 'SOL', 'BCH'], index: true })
  depositType: string;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'failed'], index: true })
  status: string;

  @Prop()
  confirmations: number;

  @Prop({ required: true, index: true })
  depositAddress: string;

  @Prop({ default: null })
  receiveFromAddress?: string;

  @Prop({ default: null, index: true })
  txHash?: string;

  @Prop({ default: null, index: true })
 confirmedAt?: Date;

 @Prop({ default: null})
  transDate?: string;

  @Prop()
  network: string;

  @Prop({ default: 0 })
  amountUsd: number;

  @Prop({ default: 0 })
  ccyAmount: number;

  @Prop({ default: 0 })
  ccyValue: number;

  @Prop()
  txIndex: number;

  @Prop({ default: null, })
  blocktxIndex?: string;

  @Prop({ unique: true, sparse: true }) // hash might be null initially
  hash: string;

  @Prop({ default: 'Deposit Request Initiated' })
  statusDesc: string;

  @Prop({ default: '0' })
  charges: string;

  @Prop({ default: 'Auto Deposit' })
  msg: string;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);

// Compound index for depositAddress + hash for efficient lookups
//DepositSchema.index({ depositAddress: 1, hash: 1 }, { unique: true, sparse: true });
DepositSchema.index({ userId: 1 });
DepositSchema.index({ depositAddress: 1 });
DepositSchema.index({ confirmedAt: -1 }); 
DepositSchema.index({ status: 1, confirmedAt: -1 });


DepositSchema.pre('save', function (next) {
  if (this.isNew && !this.depositReference && this.depositAddress && this._id) {
    const first3 = this.depositAddress.slice(0, 3).toLowerCase();
    const last3 = this.depositAddress.slice(-3).toLowerCase();
    const idPart = this._id.toString().slice(-4);
    const timestamp = Date.now();
    const code = Math.floor(100000 + Math.random() * 900000);
    this.depositReference = `${idPart}${first3}${last3}${timestamp}${code}`;
  }
  next();
});
