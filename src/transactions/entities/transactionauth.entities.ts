import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type TransactionAuthDocument = TransactionAuth & Document;

@Schema({ timestamps: true })
export class TransactionAuth {

 @Prop({ unique: true, index: true })
  custTransactionReference: string; 

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  depositAmountUsd: number;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'failed', 'expired'], index: true })
  status: string;

  @Prop()
  paymentName: string;

  @Prop()
  paymentImageUrl: string;

  @Prop()
  network: string;
  
  @Prop({ default: 'Deposit Request Initiated' })
  statusDesc: string;

  @Prop()
  paymentLink: string;


}

export const TransactionAuthSchema = SchemaFactory.createForClass(TransactionAuth);

TransactionAuthSchema.index({ userId: 1 });
TransactionAuthSchema.index({ depositAddress: 1 });
TransactionAuthSchema.index({ confirmedAt: -1 }); 
TransactionAuthSchema.index({ status: 1, confirmedAt: -1 });

