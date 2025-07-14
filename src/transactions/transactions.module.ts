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
import { TransactionAuth, TransactionAuthSchema } from './entities/transactionauth.entities';
import { CryptoRateUtil } from 'src/common/utils/crypto-rate.util';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';
import { IncomingHooks, IncomingHooksSchema } from 'src/deposits/entities/incominghooks.entity';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema },{ name: Deposit.name, schema: DepositSchema},{ name: Transaction.name, schema: TransactionSchema},
        { name: TransactionAuth.name, schema: TransactionAuthSchema},{ name: IncomingHooks.name, schema: IncomingHooksSchema}]),
      DepositsModule,SecretsModule,SQSModule,AuthModule,
    ],
  controllers: [TransactionsController],
  providers: [TransactionService,QrCodeService,TransactionsGateway,HttpRequestUtil,CryptoRateUtil,EncryptionService],
  exports: [TransactionService,QrCodeService,TransactionsGateway,EncryptionService],
})
export class TransactionsModule {}
