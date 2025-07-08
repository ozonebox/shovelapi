import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { VerifyModule } from 'src/verify/verify.module';
import { VerifyService } from 'src/verify/verify.service';
import { AuthModule } from 'src/auth/auth.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { SecretsModule } from 'src/aws/secrets/secrets.module';
import { ResetaccountService } from 'src/resetaccount/resetaccount.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,WalletsModule,SecretsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService,VerifyService,ResetaccountService,],
})
export class UsersModule {}
