import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';

export type AddressSolDocument = AddressSol & Document;

@Schema({ timestamps: true })
export class AddressSol {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;
  @Prop({ type: String,required: true,index: true })
    transactionId: Types.ObjectId;
  
    @Prop({ index: true })
    custTransactionReference: string; 
  
    @Prop({  index: true })
    transactionReference: string;

  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true, enum: ['SOL'] })
  network: string;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ required: true })
  type: string;
}

export const AddressSolSchema = SchemaFactory.createForClass(AddressSol);
