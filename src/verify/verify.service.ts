import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { sendEmail } from 'src/common/helpers/email.helpers';
import { sendResponse } from 'src/common/helpers/response.helpers';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { Responses } from 'src/common/constants/responses';
import { VerifyUserCompleteDto } from './dto/verify-user-complete.dto';
import { omit } from 'src/common/helpers/omit.helpers';
import { WalletsService } from 'src/wallets/wallets.service';
import { SecretsService } from 'src/aws/secrets/secrets.service';

@Injectable()
export class VerifyService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
private readonly configService: ConfigService,private readonly authService: AuthService,
private readonly walletService: WalletsService,private readonly secretsService: SecretsService,) {}

  async verifyUser(emailAddress: string,authKey?:string) {
    let user;
    if(!authKey){
       user = await this.userModel.findOne({ emailAddress: emailAddress.toLowerCase() });
    }else{
       user = await this.userModel.findOne({ emailAddress: emailAddress.toLowerCase(),hash:authKey });
    }
    

    if (!user){
       return sendResponse({
          responsecode: Responses.INVALID_LOGIN_CREDENTIALS.responsecode,
          responsemessage: Responses.INVALID_LOGIN_CREDENTIALS.responsemessage,
        });
    }
    if (user.isVerified == 'true') {
      return sendResponse({
          responsecode: Responses.USER_ALREADY_VERIFIED.responsecode,
          responsemessage: Responses.USER_ALREADY_VERIFIED.responsemessage,
      });
      
    }

    if (user.isVerified == 'blocked') {
      return sendResponse({
          responsecode: Responses.ACCOUNT_BLOCKED.responsecode,
          responsemessage: Responses.ACCOUNT_BLOCKED.responsemessage,
      });
      
    }

    const now = new Date();
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

    if (!user.otpLastSentAt || user.otpLastSentAt < tenMinsAgo) {
      user.otpCount = 0;
    }

    if (user.otpCount >= 5) {
      return sendResponse({
          responsecode: Responses.TOO_MANY_OTP_REQUESTS.responsecode,
          responsemessage: Responses.TOO_MANY_OTP_REQUESTS.responsemessage,
      });
    
    }

    const otp = uuidv4().split('-')[0];
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.hash = hashedOtp;
    user.otpCount += 1;
    user.otpLastSentAt = now;
    await user.save();

    const domain = this.configService.get('DOMAINNAME');
    const msg = `Kindly use ${otp} as your OTP code to verify your new ${domain} account`;

    await sendEmail(this.configService, {
      to: emailAddress,
      subject: `Welcome to ${domain}. Verify Your Account Now!!!`,
      html: `<p>${msg}</p>`,
    });
     const token = this.authService.generateToken(user)
   

    console.log(` OTP sent to ${emailAddress}: ${otp}`);
    return sendResponse({
        responsecode: Responses.OTP_SENT.responsecode,
        responsemessage: Responses.OTP_SENT.responsemessage,
        authKey:hashedOtp,
        token,
        userSessionStatus:Responses.OTP_SENT.userSessionStatus,
      });
  }

  async verifyUserComplete(dto: VerifyUserCompleteDto) {
    const { emailAddress, otp, authKey, } = dto;
    const email = emailAddress.toLowerCase();

    const user = await this.userModel.findOne({ emailAddress: email });

    if (!user) {
      return sendResponse({
        responsecode: Responses.USER_NOT_FOUND.responsecode,
        responsemessage: Responses.USER_NOT_FOUND.responsemessage,
      });
    }

    if (user.isVerified !== 'pending') {
      return sendResponse({
        responsecode: Responses.USER_ALREADY_VERIFIED.responsecode,
        responsemessage: Responses.USER_ALREADY_VERIFIED.responsemessage,
      });
    }

    const otpMatch = await bcrypt.compare(otp, user.hash || '');
    if (!otpMatch || authKey !== user.hash) {
       if ( authKey !== user.hash) {
        return sendResponse({
          responsecode: Responses.INVALID_REQUEST.responsecode,
          responsemessage: Responses.INVALID_REQUEST.responsemessage,
        });
      }
      return sendResponse({
        responsecode: Responses.OTP_INVALID.responsecode,
        responsemessage: Responses.OTP_INVALID.responsemessage,
      });
    }

   
    user.isVerified = 'true';
    user.loginCount = 0;
    user.hash = '';
    user.otpCount = 0;
    user.otpLastSentAt = null;
    if (!user.userMnem && user.firstName && user.lastName && user._id) {
      const first3 = user.firstName.slice(0, 3).toLowerCase();
      const last3 = user.lastName.slice(0, 3).toLowerCase();
      const idPart = user._id.toString().slice(-4);
      const timestamp = Date.now().toString().slice(-6);

      user.userMnem = `${first3}${last3}${idPart}${timestamp}`;
    }
    const mnemonic = this.walletService.generateNewMnemonic();
    const secretName = `shovel/user-wallets/${user.userMnem}`;
    const secretValue = {
      secretName,
      mnemonic,
      userId: user._id.toString(),
      createdAt: new Date().toISOString(),
    };
    await this.secretsService.saveMnemonic(secretName, secretValue);

    await user.save();

    return sendResponse({
      responsecode: Responses.USER_VERIFIED.responsecode,
      responsemessage: Responses.USER_VERIFIED.responsemessage,
    });
  }
}
