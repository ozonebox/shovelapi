import { Module } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Deposit, DepositSchema } from './entities/deposit.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { WalletsModule } from 'src/wallets/wallets.module';
import { SecretsModule } from 'src/aws/secrets/secrets.module';
import { DepositScanService } from './deposit-scan.service';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';
import { CryptoRateUtil } from 'src/common/utils/crypto-rate.util';
import { DepositConfirmService } from './deposit-confirm.service';
import { SQSModule } from 'src/aws/sqs/sqs.module';
import { SqsModule } from '@ssut/nestjs-sqs';
import { DepositQueueConsumer } from './deposit-queue-consumer';
import { CacheModule } from '@nestjs/cache-manager';
import { Transaction, TransactionSchema } from 'src/transactions/entities/transaction.entity';
import { AddressesService } from 'src/wallets/address.service';
import { Address, AddressSchema } from 'src/wallets/entities/address.entity';
import { Queue, QueueSchema } from './entities/queue.entity';
import { AddressBtc, AddressBtcSchema } from 'src/wallets/entities/address.btc.entity';
import { AddressUSDTERC20 } from 'src/wallets/entities/address.usdterc20.entity';
import { AddressLtc, AddressLtcSchema } from 'src/wallets/entities/address.ltc.entity';
import { AddressSol, AddressSolSchema } from 'src/wallets/entities/address.sol.entity';
import { AddressUSDTTRC20, AddressUSDTTRC20Schema } from 'src/wallets/entities/address.usdttrc20.entity';
import { AddressBch, AddressBchSchema } from 'src/wallets/entities/address.bch.entity';
import { TransactionsGateway } from 'src/transactions/transactions.gateway';
import { AddressXrp, AddressXrpSchema } from 'src/wallets/entities/address.xrp.entity';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // cache for 5 minutes
      isGlobal: true,
    }),
    SqsModule.register({
      consumers: [
        {
          name: 'shovel-deposit-confirm',
          queueUrl: process.env.DEPOSIT_SCAN_QUEUE_URL!,
          region: process.env.AWS_REGION,
        },
      ],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },{ name: Deposit.name, schema: DepositSchema },
      { name: Transaction.name, schema: TransactionSchema},{ name: Address.name, schema: AddressSchema},{ name: AddressUSDTERC20.name, schema: AddressUSDTERC20},
      { name: AddressLtc.name, schema: AddressLtcSchema},{ name: AddressSol.name, schema: AddressSolSchema},{ name: AddressUSDTTRC20.name, schema: AddressUSDTTRC20Schema},
      { name: AddressBtc.name, schema: AddressBtcSchema},{ name: Queue.name, schema: QueueSchema},{ name: AddressBch.name, schema: AddressBchSchema, },{ name: AddressXrp.name, schema: AddressXrpSchema, }]),
    WalletsModule,SecretsModule,SQSModule
  ],
  controllers: [DepositsController],
  providers: [DepositsService,AddressesService,DepositScanService, HttpRequestUtil, CryptoRateUtil,DepositConfirmService,DepositQueueConsumer,TransactionsGateway,],
  exports: [DepositScanService,AddressesService,],
})
export class DepositsModule {}
