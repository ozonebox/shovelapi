import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { WalletsService } from 'src/wallets/wallets.service';
import { sendResponse } from 'src/common/helpers/response.helpers';
import { AddressesService } from 'src/wallets/address.service';
import { SecretsService } from 'src/aws/secrets/secrets.service';
import { Responses } from 'src/common/constants/responses';
import { Types } from 'mongoose';
import { Deposit, DepositDocument } from './entities/deposit.entity';
import { SqsService } from 'src/aws/sqs/sqs.service';


@Injectable()
export class DepositsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    private readonly walletsService: WalletsService,
    private readonly addressesService: AddressesService,
    private readonly secretsService: SecretsService,
    private readonly sqsService: SqsService,

  ) {}

  // async irnitiateDeposit(dto: CreateDepositDto) {
  //   const { emailAddress, depositType, depositAmount } = dto;
  //   const email = emailAddress.toLowerCase();

  //   const user = await this.userModel.findOne({ emailAddress: email });

  //   if (!user) {
  //     return sendResponse({
  //       responsecode: Responses.USER_NOT_FOUND.responsecode,
  //       responsemessage: Responses.USER_NOT_FOUND.responsemessage,
  //     });
  //   }

  //   if (user.isVerified !== 'true') {
  //     return sendResponse({
  //       responsecode: Responses.USER_NOT_FOUND.responsecode,
  //       responsemessage: Responses.USER_NOT_FOUND.responsemessage,
  //     });
  //   }
  //   const walletpath="shovel/user-wallets/"
  //   const mnemonic = await this.secretsService.getMnemonic(walletpath+user.userMnem);
  //   if (!mnemonic) {
  //     return sendResponse({
  //       responsecode: Responses.MNEMONIC_NOT_FOUND.responsecode,
  //       responsemessage: Responses.MNEMONIC_NOT_FOUND.responsemessage,
  //     });
  //   }

  //   // Generate and store the address
  //   const addressInfo= await this.addressesService.generateAndStoreAddress(user._id.toString(), mnemonic.mnemonic);
  //   if(addressInfo.status){
  //     const deposit = await this.depositModel.create({
  //       userId: user._id,
  //       addressId: addressInfo.addressId,
  //       addressIndex:addressInfo.index,
  //       depositAddress:addressInfo.address,
  //       depositAmount: depositAmount,
  //       depositType: depositType,
  //       status: 'pending',
  //     });
  //     const depositObject = deposit.toObject();
  //     let queueObj={
  //         id: depositObject._id,
  //         body: depositObject,
  //         delaySeconds: 3, // Delay processing for 1 minute
  //       }
  //     await this.sqsService.sendToQueue(process.env.DEPOSIT_SCAN_QUEUE_URL!, queueObj);
  //     return sendResponse({
  //     responsecode: Responses.DEPOSIT_ADDRESS_CREATED.responsecode,
  //     responsemessage: Responses.DEPOSIT_ADDRESS_CREATED.responsemessage,
  //     data: {
  //       address: addressInfo.address,
  //       network: addressInfo.network,
  //       depositType,
  //       depositAmount,
  //       index: addressInfo.index,
  //     },
  //     });
  //   }else{
  //     return sendResponse({
  //     responsecode: Responses.GENERIC_ERROR.responsecode,
  //     responsemessage: Responses.GENERIC_ERROR.responsemessage,
      
  //     });
  //   }
    
  // }
}
