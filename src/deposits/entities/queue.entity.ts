import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/wallets/entities/address.entity';

export type QueueDocument = Queue & Document;

@Schema({ timestamps: true })
export class Queue {
  @Prop({ index: true })
  custTransactionReference: string; 

  @Prop({ index: true })
  transactionReference: string;

  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Address.name, })
  addressId: Types.ObjectId;

  @Prop({  })
  addressIndex: number;

  @Prop({})
  depositAmount: number;

  @Prop({index: true })
  depositType: string;

  @Prop({ index: true })
  depositAddress: string;

  
  @Prop({ sparse: true, type: Object }) // `type: Object` allows raw JSON
  fromQueue: Record<string, any>; // or `any` if you prefer

  @Prop({ type: Object }) // same here
  procResult: Record<string, any>; // or `any`


}

export const QueueSchema = SchemaFactory.createForClass(Queue);

// Compound index for depositAddress + hash for efficient lookups
//DepositSchema.index({ depositAddress: 1, hash: 1 }, { unique: true, sparse: true });

