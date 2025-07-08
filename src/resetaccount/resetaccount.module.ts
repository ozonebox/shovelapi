import { Module } from '@nestjs/common';
import { ResetaccountService } from './resetaccount.service';

@Module({
  providers: [ResetaccountService],
})
export class ResetaccountModule {}
