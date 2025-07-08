import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { ResetAccountDto } from './dto/resetaccount.dto';
import { ResetAccountCompleteDto } from './dto/resetaccountcomplete.dto';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { sendResponse } from 'src/common/helpers/response.helpers';
import { Responses } from 'src/common/constants/responses';
import { sendEmail } from 'src/common/helpers/email.helpers';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetaccountService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
  private readonly configService: ConfigService,) {}
  
  async initiatePasswordReset(dto: ResetAccountDto) {
    const email =dto.emailAddress.toLowerCase();
  const user = await this.userModel.findOne({ emailAddress: email });

  if (!user) {
    return sendResponse({
      responsecode: Responses.INVALID_REQUEST.responsecode,
      responsemessage: Responses.INVALID_REQUEST.responsemessage,
    });
  }

  if (user.isVerified === 'blocked') {
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
  const msg = `Use ${otp} to reset your ${domain} account password. This code will expire in 10 minutes.`;

  await sendEmail(this.configService, {
    to: email,
    subject: `Reset Your ${domain} Password`,
    html: `<p>${msg}</p>`,
  });


  console.log(`Reset OTP sent to ${email}: ${otp}`);
  return sendResponse({
    responsecode: Responses.OTP_SENT_FORGOT_PASSWORD.responsecode,
    responsemessage: Responses.OTP_SENT_FORGOT_PASSWORD.responsemessage,
    authKey: hashedOtp,
  });
  }
  async completePasswordReset(dto: ResetAccountCompleteDto) {
  const { emailAddress, otp, authKey, password, passwordConfirm } = dto;
  const email = emailAddress.toLowerCase();

  const user = await this.userModel.findOne({ emailAddress: email });

  if (!user) {
    return sendResponse({
      responsecode: Responses.USER_NOT_FOUND.responsecode,
      responsemessage: Responses.USER_NOT_FOUND.responsemessage,
    });
  }

  if (user.isVerified === 'blocked') {
    return sendResponse({
      responsecode: Responses.ACCOUNT_BLOCKED.responsecode,
      responsemessage: Responses.ACCOUNT_BLOCKED.responsemessage,
    });
  }

  const otpMatch = await bcrypt.compare(otp, user.hash || '');
  if (!otpMatch || authKey !== user.hash) {
    if (authKey !== user.hash) {
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

  if (password !== passwordConfirm) {
    return sendResponse({
      responsecode: Responses.PASSWORD_MISMATCH.responsecode,
      responsemessage: Responses.PASSWORD_MISMATCH.responsemessage,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.hash = '';
  user.otpCount = 0;
  user.otpLastSentAt = null;

  await user.save();

  return sendResponse({
    responsecode: Responses.PASSWORD_RESET_SUCCESS.responsecode,
    responsemessage: Responses.PASSWORD_RESET_SUCCESS.responsemessage,
  });
}

}
