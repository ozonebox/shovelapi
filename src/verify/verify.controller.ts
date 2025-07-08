import { Body, Controller, Post } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  // @Post('resend')
  // resend(@Body() dto: VerifyUserDto) {
  //   return this.verifyService.verifyUser(dto.emailAddress);
  // }
}
