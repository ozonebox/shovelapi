import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/wallets/entities/address.entity';

export type IncomingHooksDocument = IncomingHooks & Document;

@Schema({ timestamps: true })
export class IncomingHooks {
    @Prop({ index: true })
  custTransactionReference: string; 

  @Prop({ index: true })
  transactionReference: string;

  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  userId: Types.ObjectId;

  @Prop({ })
  addressId: string;

  @Prop({  })
  addressIndex: number;

  @Prop({ index: true })
  referenceId: string; 

  @Prop({  })
  currentConfirmations: number;

  @Prop({})
  targetConfirmations: number;

  @Prop({})
  depositAmount: number;

  @Prop({index: true })
  depositType: string;

  @Prop()
  direction: string;

  @Prop({ index: true })
  depositAddress: string;

  
  @Prop({ sparse: true, type: Object }) // `type: Object` allows raw JSON
  fromQueue: Record<string, any>; // or `any` if you prefer

  @Prop({ type: Object }) // same here
  procResult:string; // or `any`


}

export const IncomingHooksSchema = SchemaFactory.createForClass(IncomingHooks);

// Compound index for depositAddress + hash for efficient lookups
//DepositSchema.index({ depositAddress: 1, hash: 1 }, { unique: true, sparse: true });

