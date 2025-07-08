import { Module } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Deposit, DepositSchema } from 'src/deposits/entities/deposit.entity';
import { DepositsModule } from 'src/deposits/deposits.module';
import { Transaction, TransactionSchema } from './entities/transaction.entity';
import { SecretsModule } from 'src/aws/secrets/secrets.module';
import { SQSModule } from 'src/aws/sqs/sqs.module';
import { QrCodeService } from './qrcode.service';
import { TransactionsGateway } from './transactions.gateway';
import { EncryptionService } from './encrypt.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema },{ name: Deposit.name, schema: DepositSchema},{ name: Transaction.name, schema: TransactionSchema}]),
      DepositsModule,SecretsModule,SQSModule,AuthModule,
    ],
  controllers: [TransactionsController],
  providers: [TransactionService,QrCodeService,TransactionsGateway,EncryptionService],
  exports: [TransactionService,QrCodeService,TransactionsGateway,EncryptionService],
})
export class TransactionsModule {}
