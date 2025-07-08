import { Module } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { SecretsModule } from 'src/aws/secrets/secrets.module';
@Module({
   imports: [
      MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
     AuthModule,WalletsModule,SecretsModule,
    ],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
