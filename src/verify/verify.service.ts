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
import { AddressesService } from 'src/wallets/address.service';

@Injectable()
export class VerifyService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
private readonly configService: ConfigService,private readonly authService: AuthService,
private readonly walletService: WalletsService,private readonly secretsService: SecretsService,
 private readonly addressesService: AddressesService,) {}

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
    let transactionReference = uuidv4().split('-')[0];
    let userObj=user.toObject()
    let transObj={
      ...userObj,
      transactionReference:transactionReference,
      custTransactionReference:transactionReference,
    }
    const rate= 0
    //create wallets
    
    let ethAddressInfo= await this.addressesService.generateAndStoreAddress(transObj, secretValue.mnemonic,'main');
    let usdterc20AddressInfo= await this.addressesService.generateAndStoreUSDTAddress(transObj, secretValue.mnemonic,'main');
    let usdttrc20AddressInfo= await this.addressesService.generateAndStoreUSDTTRC20Address(transObj, secretValue.mnemonic,'main');
    let ltcAddressInfo= await this.addressesService.generateAndStoreLtcddress(transObj, secretValue.mnemonic,'main');
    let btcAddressInfo= await this.addressesService.generateAndStoreBtcddress(transObj, secretValue.mnemonic,'main');
    let solAddressInfo= await this.addressesService.generateAndStoreSoladdress(transObj, secretValue.mnemonic,'main');
    let bchAddressInfo= await this.addressesService.generateAndStoreBchddress(transObj, secretValue.mnemonic,'main');
    let xrpAddressInfo= await this.addressesService.generateAndStoreXrpaddress(transObj, secretValue.mnemonic,'main');
    if(ethAddressInfo.status==true){
       let addrs={
        index:0,
        address:ethAddressInfo.address?? '',
        addressId:ethAddressInfo.addressId?? '0',
        currency:ethAddressInfo.network?? '',
        addressIndex:ethAddressInfo.index?? 0,
        depositType:ethAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+ethAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
      await user.save();
       this.addressesService. createEvenEventTransaction(ethAddressInfo.address??'','ethereum','ethereum','confirmed')
    }
    if(usdterc20AddressInfo.status==true){
       let addrs={
        index:0,
        address:usdterc20AddressInfo.address?? '',
        addressId:usdterc20AddressInfo.addressId?? '0',
        currency:usdterc20AddressInfo.network?? '',
        addressIndex:usdterc20AddressInfo.index?? 0,
        depositType:usdterc20AddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+usdterc20AddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
        this.addressesService. createEvenEventTransaction(usdterc20AddressInfo.address??'','ethereum','tetherusdt','confirmed')
    }
    if(usdttrc20AddressInfo.status==true){
       let addrs={
        index:0,
        address:usdttrc20AddressInfo.address?? '',
        addressId:usdttrc20AddressInfo.addressId?? '0',
        currency:usdttrc20AddressInfo.network?? '',
        addressIndex:usdttrc20AddressInfo.index?? 0,
        depositType:usdttrc20AddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+usdttrc20AddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
        this.addressesService. createEvenEventTransaction(usdttrc20AddressInfo.address??'','tron','tetherusdt','confirmed')
    }
    if(ltcAddressInfo.status==true){
       let addrs={
        index:0,
        address:ltcAddressInfo.address?? '',
        addressId:ltcAddressInfo.addressId?? '0',
        currency:ltcAddressInfo.network?? '',
        addressIndex:ltcAddressInfo.index?? 0,
        depositType:ltcAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+ltcAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
        this.addressesService. createEvenEventTransaction(ltcAddressInfo.address??'','litecoin','litecoin','unconfirmed')
        this.addressesService. createEvenEventTransaction(ltcAddressInfo.address??'','litecoin','litecoin','confirmed')
    }
    if(btcAddressInfo.status==true){
       let addrs={
        index:0,
        address:btcAddressInfo.address?? '',
        addressId:btcAddressInfo.addressId?? '0',
        currency:btcAddressInfo.network?? '',
        addressIndex:btcAddressInfo.index?? 0,
        depositType:btcAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+btcAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
         this.addressesService. createEvenEventTransaction(ltcAddressInfo.address??'','bitcoin','bitcoin','unconfirmed')
        this.addressesService. createEvenEventTransaction(ltcAddressInfo.address??'','bitcoin','bitcoin','confirmed')
    }
    if(solAddressInfo.status==true){
       let addrs={
        index:0,
        address:solAddressInfo.address?? '',
        addressId:solAddressInfo.addressId?? '0',
        currency:solAddressInfo.network?? '',
        addressIndex:solAddressInfo.index?? 0,
        depositType:solAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+solAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
        this.addressesService. createEvenEventTransaction(bchAddressInfo.address??'','solana','solana','confirmed')
    }
    if(bchAddressInfo.status==true){
       let addrs={
        index:0,
        address:bchAddressInfo.address?? '',
        addressId:bchAddressInfo.addressId?? '0',
        currency:bchAddressInfo.network?? '',
        addressIndex:bchAddressInfo.index?? 0,
        depositType:bchAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+bchAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
       await this.addressesService. createEvenEventTransaction(bchAddressInfo.address??'','bitcoin-cash','bitcoin-cash','unconfirmed')
       await this.addressesService. createEvenEventTransaction(bchAddressInfo.address??'','bitcoin-cash','bitcoin-cash','confirmed')
    }

     if(xrpAddressInfo.status==true){
       let addrs={
        index:0,
        address:xrpAddressInfo.address?? '',
        addressId:xrpAddressInfo.addressId?? '0',
        currency:xrpAddressInfo.network?? '',
        addressIndex:xrpAddressInfo.index?? 0,
        depositType:xrpAddressInfo.network?? '',
        depositAmount:rate,
        rate:rate,
        depositAmountUsd:rate,
        createdAt:new Date(),
        depositAddressQr:'http://localhost:3010/transactions/generate?data='+xrpAddressInfo.address,
      }
      user.depositAddress = user.depositAddress || [];
      user.depositAddress.push(addrs);  
       await user.save();
        this.addressesService. createEvenEventTransaction(xrpAddressInfo.address??'','xrp','xrp','confirmed')
    }

   
      
    return sendResponse({
      responsecode: Responses.USER_VERIFIED.responsecode,
      responsemessage: Responses.USER_VERIFIED.responsemessage,
    });
  }
}
