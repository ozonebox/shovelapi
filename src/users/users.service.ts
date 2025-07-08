import { ConflictException, Injectable,UnauthorizedException,ForbiddenException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { LoginUserDto } from './dto/login-user.dto';
import { sendResponse } from 'src/common/helpers/response.helpers';
import { Responses } from 'src/common/constants/responses';
import { VerifyService } from 'src/verify/verify.service';
import { AuthService } from 'src/auth/auth.service';
import { omit } from 'src/common/helpers/omit.helpers';
import { GetUserDto } from './dto/get-user.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly verifyService: VerifyService,
    private readonly authService: AuthService
  ) {}

  async login({ emailAddress, password }: LoginUserDto) {
    const email = emailAddress.toLowerCase();
    const user = await this.userModel.findOne({ emailAddress: email });

    if (!user) {
      return sendResponse({
        responsecode: Responses.INVALID_LOGIN_CREDENTIALS.responsecode,
        responsemessage: Responses.INVALID_LOGIN_CREDENTIALS.responsemessage,
      });
    }

    if (user.loginCount >= 4) {
      return sendResponse({
        responsecode: Responses.ACCOUNT_LOCKED.responsecode,
        responsemessage: Responses.ACCOUNT_LOCKED.responsemessage,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      await this.userModel.updateOne({ _id: user._id }, { $inc: { loginCount: 1 } });
      return sendResponse({
        responsecode: Responses.INVALID_LOGIN_CREDENTIALS.responsecode,
        responsemessage: Responses.INVALID_LOGIN_CREDENTIALS.responsemessage,
      });
    }

    // If user is blocked
    if (user.isVerified === 'blocked') {
      return sendResponse({
        responsecode: Responses.ACCOUNT_BLOCKED.responsecode,
        responsemessage: user.blockReason?user.blockReason:Responses.ACCOUNT_BLOCKED.responsemessage,
      });
    }

    // If user is pending
    if (user.isVerified === 'pending') {
      // send the code via email
      return this.verifyService.verifyUser(email);
    }

    if (user.isVerified === 'true') {
      await this.userModel.updateOne({ _id: user._id }, { $set: { loginCount: 0 } });
      const token = this.authService.generateToken(user)
      const userObject = user.toObject();
      const accountData = omit(userObject, ['password', 'hash', 'userMnem']);
      return sendResponse({
        responsecode: Responses.LOGIN_SUCCESS.responsecode,
        responsemessage: Responses.LOGIN_SUCCESS.responsemessage,
        userSessionStatus:Responses.LOGIN_SUCCESS.userSessionStatus,
        data:accountData,
        token,
      });
  }
  return sendResponse({
      responsecode: Responses.USER_NOT_VERIFIED.responsecode,
      responsemessage: Responses.USER_NOT_VERIFIED.responsemessage,
    });
  }

  

  async register(createUserDto: CreateUserDto) {
  const email = createUserDto.emailAddress.toLowerCase();

  const existing = await this.userModel.findOne({
    $or: [{ emailAddress: email }],
  });

  if (existing) {
    return sendResponse({
    responsecode: Responses.USER_ALREADY_EXISTS.responsecode,
    responsemessage: Responses.USER_ALREADY_EXISTS.responsemessage,
  });
  }

  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const user = new this.userModel({
    ...createUserDto,
    password: hashedPassword,
    emailAddress: email,
    isVerified: 'pending',
    
  });

  await user.save();
  return sendResponse({
    responsecode: Responses.REGISTER_SUCCESS.responsecode,
    responsemessage: Responses.REGISTER_SUCCESS.responsemessage,
  });
}

async getUserDetails({ emailAddress }: GetUserDto) {
    const email = emailAddress.toLowerCase();
    const user = await this.userModel.findOne({ emailAddress: email });

    if (!user) {
      return sendResponse({
        responsecode: Responses.INVALID_LOGIN_CREDENTIALS.responsecode,
        responsemessage: Responses.INVALID_LOGIN_CREDENTIALS.responsemessage,
      });
    }

    if (user.loginCount >= 4) {
      return sendResponse({
        responsecode: Responses.ACCOUNT_LOCKED.responsecode,
        responsemessage: Responses.ACCOUNT_LOCKED.responsemessage,
      });
    }


    // If user is blocked
    if (user.isVerified === 'blocked') {
      return sendResponse({
        responsecode: Responses.ACCOUNT_BLOCKED.responsecode,
        responsemessage: user.blockReason?user.blockReason:Responses.ACCOUNT_BLOCKED.responsemessage,
      });
    }


   
      await this.userModel.updateOne({ _id: user._id }, { $set: { loginCount: 0 } });
      const token = this.authService.generateToken(user)
      const userObject = user.toObject();
      const accountData = omit(userObject, ['password', 'hash', 'userMnem']);
       if (user.isVerified === 'true') {
          return sendResponse({
        responsecode: Responses.LOGIN_SUCCESS.responsecode,
        responsemessage: Responses.LOGIN_SUCCESS.responsemessage,
        userSessionStatus:Responses.LOGIN_SUCCESS.userSessionStatus,
        data:accountData,
        token,
      });
      }
       if (user.isVerified === 'pending') {
         return sendResponse({
        responsecode: Responses.OTP_SENT.responsecode,
        responsemessage: Responses.LOGIN_SUCCESS.responsemessage,
        userSessionStatus:Responses.OTP_SENT.userSessionStatus,
        data:accountData,
        token,
      });
      }
     
   
    return sendResponse({
        responsecode: Responses.USER_NOT_VERIFIED.responsecode,
        responsemessage: Responses.USER_NOT_VERIFIED.responsemessage,
      });
  }
  
}
