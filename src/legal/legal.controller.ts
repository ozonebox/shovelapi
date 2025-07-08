import { Controller, Get, Post, Body, Patch, Param, Delete ,Res} from '@nestjs/common';
import { LegalService } from './legal.service';
import { CreateLegalDto } from './dto/create-legal.dto';
import { UpdateLegalDto } from './dto/update-legal.dto';
import { Response } from 'express';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('terms')
  getTerms() {
    return {
      title: 'Terms of Service',
      content: this.legalService.getTerms(),
    };
  }

  @Get('privacy')
  getPrivacy() {
    return {
      title: 'Privacy Policy',
      content: this.legalService.getPrivacy(),
    };
  }
}
