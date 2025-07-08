import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyUserDto } from 'src/verify/dto/verify-user.dto';
import { VerifyService } from 'src/verify/verify.service';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import { Responses } from 'src/common/constants/responses';
import { VerifyUserCompleteDto } from 'src/verify/dto/verify-user-complete.dto';
import { ResetaccountService } from 'src/resetaccount/resetaccount.service';
import { ResetAccountDto } from 'src/resetaccount/dto/resetaccount.dto';
import { ResetAccountCompleteDto } from 'src/resetaccount/dto/resetaccountcomplete.dto';
import { GetUserDto } from './dto/get-user.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly verifyService: VerifyService,
     private readonly resetaccountService: ResetaccountService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto,@Res() res: Response) {
    const response = await this.usersService.register(dto);
    if (response.responsecode === '00') {
      return res.status(200).json(response); 
    }
    return res.status(200).json(response);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto,@Res() res: Response) {
    const response = await this.usersService.login(dto);
    if (response.responsecode === Responses.LOGIN_SUCCESS.responsecode||response.responsecode === Responses.OTP_SENT.responsecode) {
      res.cookie('auth_token', response.token, {
          httpOnly: true,           
          secure: true,             
          sameSite: 'strict',       
          maxAge: 1000 * 60 * 60,   
          path: '/',                
        })
      return res.status(200).json(response); 
    }else{
      res.clearCookie('auth_token');
      return res.status(200).json(response);
    }
       
  }

  @Post('get-account-details')
  async getAccountDetails(@Body() dto: GetUserDto,@Res() res: Response) {
    const response = await this.usersService.getUserDetails(dto);
   return res.status(200).json(response);
    
  }

  @Post('resend-otp')
  async verifyUser(@Body() dto: VerifyUserDto,@Res() res: Response) {
     const response = await this.verifyService.verifyUser(dto.emailAddress,dto.authKey);
     if (response.responsecode === '66') {
       res.cookie('auth_token', response.token, {
          httpOnly: true,           
          secure: true,             
          sameSite: 'strict',       
          maxAge: 1000 * 60 * 60,   
          path: '/',                
        })
      return res.status(200).json(response); 
    }
    return res.status(200).json(response);
    
  }

  @Post('verify-user-complete')
  async verifyUsercomplete(@Body() dto: VerifyUserCompleteDto,@Res() res: Response) {
    const response = await this.verifyService.verifyUserComplete(dto);
   return res.status(200).json(response);
    
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ResetAccountDto,@Res() res: Response) {
    const response = await this.resetaccountService.initiatePasswordReset(dto);
   return res.status(200).json(response);
    
  }

  @Post('forgot-password-complete')
  async forgotPasswordComplete(@Body() dto: ResetAccountCompleteDto,@Res() res: Response) {
    const response = await this.resetaccountService.completePasswordReset(dto);
   return res.status(200).json(response);
    
  }

  
}
