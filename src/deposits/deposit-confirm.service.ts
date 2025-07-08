import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types } from 'mongoose';
import { Deposit, DepositDocument } from './entities/deposit.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { sendResponseJson } from 'src/common/helpers/response.helpers';
import { TransactionDocument } from 'src/transactions/entities/transaction.entity';
import { Transaction } from 'ethers';
import { TransactionsGateway } from 'src/transactions/transactions.gateway';

interface ResponseJsonOptions {
  responsecode: string;
  responsemessage: string;
  data?: any;
  success?: boolean;
  [key: string]: any; // for extra fields like token, meta, etc.
}
@Injectable()
export class DepositConfirmService {
  private readonly logger = new Logger(DepositConfirmService.name);
    i
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    
  ) {}


  
  async confirmDeposit(payload: {
  method: string;
  hash: string;
  depositAddress: string;
  ccyAmount: number;
  amountUsd: number;
  ccyValue: number;
  confirmations: number;
  receiveFromAddress?: string;
  txIndex:number;
  txDate:string;
  transactionIndex:string;
}) {
  const {
    method,
    hash,
    depositAddress,
    ccyAmount,
    amountUsd,
    ccyValue,
    confirmations,
    receiveFromAddress,
    txIndex,
    txDate,
    transactionIndex,
  } = payload;
  console.log('amountUsd',amountUsd)
  if (amountUsd < 0.00001) {
    return sendResponseJson({
      responsecode: '23',
      responsemessage: 'Invalid Deposit Amount',
    });
  }

  const exisitngTransaction = await this.transactionModel.findOne({ depositAddress,depositType:method});
  if(!exisitngTransaction){
      return sendResponseJson({
      responsecode: '23',
      responsemessage: 'Address not inuse for deposit',
    });
  }
  const transactionId=new Types.ObjectId((exisitngTransaction as any)._id);
  const existing = await this.depositModel.findOne({ hash });

  if (existing) {
    if (existing.confirmations < 1 && confirmations > 0) {
      existing.custTransactionReference=exisitngTransaction.custTransactionReference;
      existing.transactionReference=exisitngTransaction.transactionReference;
      existing.transactionId = transactionId;
      existing.confirmations = confirmations;
      existing.blocktxIndex = transactionIndex;
      existing.ccyAmount = ccyAmount;
      existing.amountUsd = amountUsd;
      existing.ccyValue = ccyValue;
      existing.status = 'confirmed';
      existing.statusDesc = 'Deposit Confirmed';
      existing.confirmedAt = new Date();
      existing.transDate=txDate;
      await existing.save();
      exisitngTransaction.ccyAmount = exisitngTransaction.ccyAmount? exisitngTransaction.ccyAmount+ccyAmount:ccyAmount
      exisitngTransaction.amountUsd = exisitngTransaction.amountUsd?exisitngTransaction.amountUsd + amountUsd:amountUsd;
      exisitngTransaction.ccyValue = ccyValue;
      exisitngTransaction.status =  exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'confirmed' : 'pending';
      exisitngTransaction.statusDesc = exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'Transaction fully Confirmed' : 'Transaction Partially Received';
      exisitngTransaction.confirmedAt = new Date();
      exisitngTransaction.transDate=txDate;
      await exisitngTransaction.save();

      await this.userModel.updateOne(
        { _id: existing.userId },
        {
          $inc: {
            balanceUsd: amountUsd,
            [`balance${method.toUpperCase()}`]: ccyAmount,
          },
        },
      );

      return sendResponseJson({
        responsecode: '00',
        responsemessage: 'Request Confirmed',
      });
    }

    return sendResponseJson({
      responsecode: '21',
      responsemessage: 'Request Already Processed and Confirmed',
    });
  }

  const pending = await this.depositModel.findOne({
    depositAddress,
  });

  console.log('pending',pending)
  if (pending||exisitngTransaction) {
    
    if (pending==null||pending?.hash && pending.hash !== hash) {
      // Create a new record if the hash is different
      console.log('should behere',pending)
      const newDeposit = new this.depositModel({
        userId: exisitngTransaction.userId,
        addressId: exisitngTransaction.addressId,
        depositAddress,
        addressIndex: exisitngTransaction.addressIndex,
        depositAmount: ccyAmount,
        depositType: exisitngTransaction.depositType,
        network: method,
        hash,
        txIndex,
        txHash: hash,
        confirmations,
        ccyAmount,
        ccyValue,
        amountUsd,
        blocktxIndex :transactionIndex,
        transDate:txDate,
        custTransactionReference:exisitngTransaction.custTransactionReference,
        transactionReference:exisitngTransaction.transactionReference,
        transactionId :  transactionId,
        receiveFromAddress: receiveFromAddress || '',
        status: confirmations > 0 ? 'confirmed' : 'pending',
        statusDesc: confirmations > 0 ? 'Deposit Confirmed' : 'Deposit Received',
        msg: 'Auto Deposit',
      });
      exisitngTransaction.ccyAmount = exisitngTransaction.ccyAmount?exisitngTransaction.ccyAmount +ccyAmount:ccyAmount;
      exisitngTransaction.amountUsd = exisitngTransaction.amountUsd? exisitngTransaction.amountUsd + amountUsd:amountUsd;
      exisitngTransaction.ccyValue = ccyValue;
      exisitngTransaction.status =  exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'confirmed' : 'pending';
      exisitngTransaction.statusDesc = exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'Transaction fully Confirmed' : 'Transaction Partially Received';
      exisitngTransaction.transDate=txDate;
      if (confirmations > 0) {
        newDeposit.confirmedAt = new Date();
        exisitngTransaction.confirmedAt = new Date();
      }

      await newDeposit.save();
       await exisitngTransaction.save();

      if (confirmations > 0) {
        await this.userModel.updateOne(
          { _id: exisitngTransaction.userId },
          {
            $inc: {
              balanceUsd: amountUsd,
              [`balance${method.toUpperCase()}`]: ccyAmount,
            },
          },
        );
      }

      return sendResponseJson({
        responsecode: '00',
        responsemessage:
          confirmations > 0
            ? 'New Deposit Record Created and Confirmed'
            : 'New Deposit Record Created',
      });
    }
    
    if(pending){
    // If the hash is not set yet or matches, update the pending one
      pending.custTransactionReference=exisitngTransaction.custTransactionReference;
      pending.transactionReference=exisitngTransaction.transactionReference;
      pending.transactionId =  transactionId;
      pending.transDate=txDate;
      pending.txIndex=txIndex;
      pending.hash = hash;
      pending.txHash = hash;
      pending.blocktxIndex = transactionIndex;
      pending.confirmations = confirmations;
      pending.ccyAmount = ccyAmount;
      pending.ccyValue = ccyValue;
      pending.amountUsd = amountUsd;
      pending.receiveFromAddress = receiveFromAddress || '';
      pending.status = confirmations > 0 ? 'confirmed' : 'pending';
      pending.statusDesc =
        confirmations > 0 ? 'Deposit Confirmed' : 'Deposit Received';
        if (confirmations > 0) {
        pending.confirmedAt = new Date();
       
      }

      await pending.save();

    }
      exisitngTransaction.ccyAmount = exisitngTransaction.ccyAmount? exisitngTransaction?.ccyAmount+ccyAmount:ccyAmount;
      exisitngTransaction.amountUsd = exisitngTransaction.amountUsd? exisitngTransaction?.amountUsd+ amountUsd:amountUsd;
      exisitngTransaction.ccyValue = ccyValue;
      exisitngTransaction.status =  exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'confirmed' : 'pending';
      exisitngTransaction.statusDesc = exisitngTransaction.ccyAmount >= exisitngTransaction.depositAmount ? 'Transaction fully Confirmed' : 'Transaction Partially Received';
      exisitngTransaction.transDate=txDate;

      if (confirmations > 0) {
        exisitngTransaction.confirmedAt = new Date();
      }

      await exisitngTransaction.save();

      if (confirmations > 0) {
        await this.userModel.updateOne(
          { _id: exisitngTransaction.userId },
          {
            $inc: {
              balanceUsd: amountUsd,
              [`balance${method.toUpperCase()}`]: ccyAmount,
            },
          },
        );
      }

      return sendResponseJson({
        responsecode: '00',
        responsemessage:
          confirmations > 0
            ? 'Request Processed and Confirmed Successfully'
            : 'Request Processed Successfully',
      });
    
  }


  // If no pending deposit for address
  return sendResponseJson({
    responsecode: '11',
    responsemessage: 'Address  not in use for deposit',
  });
}

}
