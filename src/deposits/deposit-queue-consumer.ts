import { Injectable, Logger } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit, DepositDocument } from 'src/deposits/entities/deposit.entity';
import { DepositScanService } from './deposit-scan.service';
import { Transaction } from 'ethers';
import { TransactionDocument } from 'src/transactions/entities/transaction.entity';
import { Queue, QueueDocument } from './entities/queue.entity';
import { TransactionsGateway } from 'src/transactions/transactions.gateway';

@Injectable()
export class DepositQueueConsumer {
  private readonly logger = new Logger(DepositQueueConsumer.name);

  constructor(
    @InjectModel(Deposit.name)
    private readonly depositModel: Model<DepositDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Queue.name) private queueModel: Model<QueueDocument>,
    private readonly depositScanService: DepositScanService,
    private readonly transactionsGateway: TransactionsGateway
  ) {}

  @SqsMessageHandler('shovel-deposit-confirm', false)
  async handleMessage(message: { Body: string }): Promise<void> {
    
    try {
       
    
       const outer = JSON.parse(message.Body);
        const payload = outer.body; // this is you

       console.log("parsed>>>",payload)
       const newQueue = await this.queueModel.create({
          fromQueue: payload,
        });
      const depositAddress = payload.depositAddress;
      newQueue.custTransactionReference=payload?.custTransactionReference;
      newQueue.transactionReference=payload?.transactionReference;
      newQueue.userId=payload?.userId;
      newQueue.addressId=payload?.addressId;
      newQueue.addressIndex=payload?.addressIndex;
      newQueue.depositAmount=payload?.depositAmount;
      newQueue.depositType=payload?.depositType;
      newQueue.depositAddress=payload?.depositAddress;
      newQueue.depositAddress=payload?.depositAddress;
      await newQueue.save();

      if (!depositAddress) {
        this.logger.warn('Invalid message: no depositAddress');
        return;
      }
      let result:any;
      if(payload?.depositType=="ETH"){
      this.logger.log(`Scanning ETH address from SQS: ${depositAddress}`);
       result = await this.depositScanService.scanEthAddress(depositAddress);
      this.logger.log(`Scan result: ${JSON.stringify(result)}`);
      }else if(payload?.depositType=="USDTERC20"){
      this.logger.log(`Scanning USDT ECR-20 address from SQS: ${depositAddress}`);
       result = await this.depositScanService.scanUsdtErc20Address(depositAddress);
      this.logger.log(`Scan result: ${JSON.stringify(result)}`);
      }else{
      this.logger.log(`Scanning BTC address from SQS: ${depositAddress}`);
       result = await this.depositScanService.scanBtcAddress(depositAddress);
      this.logger.log(`Scan result: ${JSON.stringify(result)}`);
      }
      newQueue.procResult=result;
      await newQueue.save();
      const transactions = await this.transactionModel.find({ depositAddress,depositType:payload?.depositType });
      const now = new Date();
      for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];
          if (tx.status === 'pending' && tx.expiresIn && now > tx.expiresIn) {
            tx.status = 'expired';
            tx.statusDesc = 'Transaction Expired';
            const updated = await tx.save();
            transactions[i] = updated;
          }
      }
      if (transactions.length === 0) {
        this.logger.warn(`No transaction found for ${depositAddress}`);
        throw new Error('Retry later: no matching transaction yet');
      }
       const enriched = await Promise.all(
        transactions.map(async (tx) => {
          const deposits = await this.depositModel
            .find({ custTransactionReference: tx.custTransactionReference })
            .sort({ createdAt: -1 })
            .lean();

          return {
            ...tx.toObject(), // convert to plain object so it's safe to send to frontend
            deposits,
          };
        })
      );


      const allConfirmed = transactions.every(
        (d) => d.status === 'confirmed'
      );

      const allExpired = transactions.every(
        (d) => d.status === 'expired'
      );
      if (allExpired) {
        this.logger.log(` Transaction expired for ${depositAddress}, message will be deleted.`);
        //send alert
        await this.transactionsGateway.sendTransactionUpdate(
          transactions[0].custTransactionReference,
          {
            status: 'expired',
            depositAmount: transactions[0].depositAmount,
            depositType: transactions[0].depositType,
            confirmedAt: '',
            data:enriched[0],
          },
        );
        return; // success: message is deleted
      } 

      if (!allConfirmed) {
        this.logger.warn(`Not all transaction are confirmed for ${depositAddress}`);
        await this.transactionsGateway.sendTransactionUpdate(
          transactions[0].custTransactionReference,
          {
            status: 'pending',
            depositAmount: transactions[0].depositAmount,
            depositType: transactions[0].depositType,
            confirmedAt: '',
            data:enriched[0],
          },
        );
        throw new Error('Retry: waiting for all confirmations');
      }

      const totalCcyValue = transactions.reduce((sum, d) => sum + (d.ccyValue || 0), 0);
      const avgDepositAmount =
        transactions.reduce((sum, d) => sum + (d.depositAmount || 0), 0) /
        (transactions.length || 1);

      if (totalCcyValue >= avgDepositAmount) {
        this.logger.log(` Conditions met for ${depositAddress}, message will be deleted.`);
        //send alert 
        await this.transactionsGateway.sendTransactionUpdate(
          transactions[0].custTransactionReference,
          {
            status: 'confirmed',
            depositAmount: transactions[0].depositAmount,
            depositType: transactions[0].depositType,
            confirmedAt: new Date(),
            data:enriched[0],
          },
        );
        return; // success: message is deleted
      } else {
        this.logger.warn(`CcyValue condition failed for ${depositAddress}`);
        await this.transactionsGateway.sendTransactionUpdate(
          transactions[0].custTransactionReference,
          {
            status: 'pending',
            depositAmount: transactions[0].depositAmount,
            depositType: transactions[0].depositType,
            confirmedAt: '',
            data:enriched[0],
          },
        );
        throw new Error('Retry: total ccyvalue not sufficient');
      }
    } catch (err) {
      this.logger.error('Error in queue consumer: ', err+" msg> " || err);
      throw err; // rethrow to retry
    }
  }
}
