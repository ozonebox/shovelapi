import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsModule } from './wallets/wallets.module';
import { SecretsModule } from './aws/secrets/secrets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DepositsModule } from './deposits/deposits.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LegalModule } from './legal/legal.module';
import { DataModule } from './data/data.module';


@Module({
  imports: [
     

    MongooseModule.forRoot(process.env.MONGO_URI as string),
    ConfigModule.forRoot({ isGlobal: true }),
    WalletsModule,SecretsModule, UsersModule, AuthModule, DepositsModule, TransactionsModule, LegalModule, DataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
