import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true,index: true })
  transactionId: Types.ObjectId;
  
    @Prop({  index: true })
  custTransactionReference: string; 
  
  @Prop({ index: true })
  transactionReference: string;

  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true, enum: ['ETH'] })
  network: string;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ required: true })
  type: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
