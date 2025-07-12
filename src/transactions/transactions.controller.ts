import { Controller, Get, Post, Body, Patch, Param, Delete,Res,Query } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Response } from 'express';
import { GetTransactionDto } from './dto/get-transaction.dto';
import { QrCodeService } from './qrcode.service';
import { DecryptTransactionDto } from './dto/decrypt-transaction.dto';
import { CreateTransactionAuthDto } from './dto/create-transaction-auth.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionService,
    private readonly qrCodeService: QrCodeService,
  ) {}

    @Post('initiate-deposit')
    async initiateDeposit(@Body() dto: CreateTransactionDto,@Res() res: Response) {
      const response = await this.transactionsService.initiateDeposit(dto);
     
       return res.status(200).json(response);
    }

    @Post('get-payment')
    async gettransaction(@Body() dto: GetTransactionDto,@Res() res: Response) {
      const response = await this.transactionsService.getTransactionDetailsWithDeposits(dto);
     
       return res.status(200).json(response);
    }
     @Post('init-payment')
    async initpayment(@Body() dto: DecryptTransactionDto,@Res() res: Response) {
      const response = await this.transactionsService.decryptPaymentPayload(dto.encrypted.replaceAll(" ",""));
     
       return res.status(200).json(response);
    }

    @Post('auth-payment')
    async authpayment(@Body() dto: CreateTransactionAuthDto,@Res() res: Response) {
      const response = await this.transactionsService.prepareDeposit(dto);
     
       return res.status(200).json(response);
    }

      @Get('generate')
      async generateQrCode(@Query('data') data: string, @Res() res: Response) {
        if (!data) {
          return res.status(400).send('Missing QR data');
        }
        return this.qrCodeService.streamQrCodePng(data, res);
      }
}
