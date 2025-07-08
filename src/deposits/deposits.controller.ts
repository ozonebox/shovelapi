import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { Response } from 'express';


@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}
  // @Post('initiatedeposit')
  // async initiateDeposit(@Body() dto: CreateDepositDto,@Res() res: Response) {
  //   const response = await this.depositsService.initiateDeposit(dto);
   
  //    return res.status(200).json(response);
  // }
} 
