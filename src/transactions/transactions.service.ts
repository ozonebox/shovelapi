import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { WalletsService } from 'src/wallets/wallets.service';
import { sendResponse } from 'src/common/helpers/response.helpers';
import { AddressesService } from 'src/wallets/address.service';
import { SecretsService } from 'src/aws/secrets/secrets.service';
import { Responses } from 'src/common/constants/responses';
import { Types } from 'mongoose';
import { Transaction, TransactionDocument } from './entities/transaction.entity';
import { SqsService } from 'src/aws/sqs/sqs.service';
import { Deposit, DepositDocument } from 'src/deposits/entities/deposit.entity';
import { GetTransactionDto } from './dto/get-transaction.dto';
import { EncryptionService } from './encrypt.service';
import { AuthService } from 'src/auth/auth.service';


@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    private readonly addressesService: AddressesService,
    private readonly secretsService: SecretsService,
    private readonly sqsService: SqsService,
    private readonly encryptionService: EncryptionService,
    private readonly authService: AuthService,

  ) {}

  async initiateDeposit(dto: CreateTransactionDto) {
    const { custTransactionReference,emailAddress, depositType, depositAmount,paymentName,paymentImageUrl, } = dto;
    const email = emailAddress.toLowerCase();

    const user = await this.userModel.findOne({ emailAddress: email });

    if (!user) {
      return sendResponse({
        responsecode: Responses.USER_NOT_FOUND.responsecode,
        responsemessage: Responses.USER_NOT_FOUND.responsemessage,
      });
    }

    if (user.isVerified !== 'true') {
      return sendResponse({
        responsecode: Responses.USER_NOT_FOUND.responsecode,
        responsemessage: Responses.USER_NOT_FOUND.responsemessage,
      });
    }
    const walletpath="shovel/user-wallets/"
    try{
      const transaction = await this.transactionModel.create({
        userId: user._id,
        custTransactionReference,
        depositAmount: depositAmount,
        depositType: depositType,
        paymentName,
        paymentImageUrl,
        status: 'pending',
      });

      
      const mnemonic = await this.secretsService.getMnemonic(walletpath+user.userMnem);
        if (!mnemonic) {
          return sendResponse({
            responsecode: Responses.MNEMONIC_NOT_FOUND.responsecode,
            responsemessage: Responses.MNEMONIC_NOT_FOUND.responsemessage,
          });
        }
        const transType=dto.depositType;
        let addressInfo:any;
        let transObj=transaction.toJSON();
        if(transType=="ETH"){
          addressInfo= await this.addressesService.generateAndStoreAddress(transObj, mnemonic.mnemonic);
        }else if(transType=="USDTERC20"){
          addressInfo= await this.addressesService.generateAndStoreUSDTAddress(transObj, mnemonic.mnemonic);
        }else if(transType=="USDTTRC20"){
          addressInfo= await this.addressesService.generateAndStoreUSDTTRC20Address(transObj, mnemonic.mnemonic);
        }else if(transType=="LTC"){
          addressInfo= await this.addressesService.generateAndStoreLtcddress(transObj, mnemonic.mnemonic);
        }else if(transType=="BTC"){
            addressInfo= await this.addressesService.generateAndStoreBtcddress(transObj, mnemonic.mnemonic);
        }else if(transType=="SOL"){
            addressInfo= await this.addressesService.generateAndStoreSoladdress(transObj, mnemonic.mnemonic);
        }else if(transType=="BCH"){
            addressInfo= await this.addressesService.generateAndStoreBchddress(user._id.toString(), mnemonic.mnemonic);
        }
        // Generate and store the address
        
        if(addressInfo?.status){
            transaction.network=addressInfo.network;
            transaction.addressId= addressInfo.addressId;
            transaction.addressIndex=addressInfo.index;
            transaction.depositAddress=addressInfo.address;
          
            const token = this.authService.generateToken(user);
            let tobj=transaction.toJSON();
            const enc ={
              ...tobj,
              token,
              owner:user.firstName+" "+user.lastName
            }
            
            const encyrptedval=this.encryptionService.encrypt(enc);
            console.log('encyrptedval',encyrptedval);
            const encyrptedlink="http://localhost:3002/pay/initiate?r="+encyrptedval;
            const paymentlink=encyrptedlink;
            transaction.paymentLink=paymentlink;
            await transaction.save();
            let queueObj={
              id: transaction._id,
              body: transaction,
              delaySeconds: 3, // Delay processing for 1 minute
            }
            await this.sqsService.sendToQueue(process.env.DEPOSIT_SCAN_QUEUE_URL!, queueObj);
            //jwt,encrypt
            
            return sendResponse({
            responsecode: Responses.DEPOSIT_ADDRESS_CREATED.responsecode,
            responsemessage: Responses.DEPOSIT_ADDRESS_CREATED.responsemessage,
            data: {
              address: addressInfo.address,
              network: addressInfo.network,
              depositType,
              depositAmount,
              index: addressInfo.index,
              expiresIn:transaction.expiresIn,
              paymentlink,
            },
            });

          
          


          
        }else{
          transaction.depositAddress='error generating address',
          await transaction.save();
          return sendResponse({
          responsecode: Responses.GENERIC_ERROR.responsecode,
          responsemessage: Responses.GENERIC_ERROR.responsemessage,
          error:addressInfo.error
          
          });
        }
    
    }catch(err){
          return sendResponse({
          responsecode: Responses.GENERIC_ERROR.responsecode,
          responsemessage: Responses.GENERIC_ERROR.responsemessage,
          error:err,
      
      });
      }
  }

 async getTransactionDetailsWithDeposits(dto: GetTransactionDto) {
  const {
    emailAddress,
    transactionReference,
    custTransactionReference,
    depositAddress,
  } = dto;

  if (!transactionReference && !custTransactionReference && !depositAddress) {
    return sendResponse({
      responsecode: Responses.GET_TRANS_ERROR.responsecode,
      responsemessage: Responses.GET_TRANS_ERROR.responsemessage,
    });
  }

  const email = emailAddress.toLowerCase();
  const user = await this.userModel.findOne({ emailAddress: email });

  if (!user || user.isVerified !== 'true') {
    return sendResponse({
      responsecode: Responses.INVALID_REQUEST.responsecode,
      responsemessage: Responses.INVALID_REQUEST.responsemessage,
    });
  }

  try {
    const filter: any = { userId: user._id };

    if (transactionReference) {
      filter.transactionReference = transactionReference;
    }
    if (custTransactionReference) {
      filter.custTransactionReference = custTransactionReference;
    }
    if (depositAddress) {
      filter.depositAddress = depositAddress.toLowerCase();
    }

    let transactions = await this.transactionModel.find(filter);

    if (!transactions || transactions.length === 0) {
      return sendResponse({
        responsecode: Responses.TRANSACTION_NOT_FOUND.responsecode,
        responsemessage: Responses.TRANSACTION_NOT_FOUND.responsemessage,
      });
    }

    // Check for expired transactions and update them
    const now = new Date();
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx.status === 'pending' && tx.expiresIn && now > tx.expiresIn) {
        tx.status = 'expired';
        tx.statusDesc = 'Transaction Expired';
        transactions[i] = await tx.save(); // Update in place
      }
    }

    // Enrich with deposits
    const enriched = await Promise.all(
      transactions.map(async (tx) => {
        const deposits = await this.depositModel
          .find({ custTransactionReference: tx.custTransactionReference })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...tx.toObject(), // convert to plain object so it's safe to send to frontend
          deposits,
        };
      })
    );

    return sendResponse({
      responsecode: Responses.TRANSACTION_FOUND.responsecode,
      responsemessage: Responses.TRANSACTION_FOUND.responsemessage,
      data: enriched,
    });
  } catch (error) {
    return sendResponse({
      responsecode: Responses.GENERIC_ERROR.responsecode,
      responsemessage: Responses.GENERIC_ERROR.responsemessage,
      error,
    });
  }
  }

  async decryptPaymentPayload(encrypted: string) {
    if (!encrypted) {
      return sendResponse({
        responsecode: Responses.INVALID_REQUEST.responsecode,
        responsemessage: 'Missing encrypted data'
      });
    }

    try {
      const decrypted = this.encryptionService.decrypt(encrypted);
      const token=decrypted.token;
      if (this.authService.verifyToken(token)){
          return sendResponse({
        responsecode: Responses.TRANSACTION_FOUND.responsecode,
        responsemessage: 'Decryption successful',
        data: decrypted
      });
      } else{
      return sendResponse({
        responsecode: Responses.INVALID_TRANSACTION.responsecode,
        responsemessage: Responses.INVALID_TRANSACTION.responsecode,
      });
      }
    } catch (error) {
      console.log('error',encrypted+" >>"+error)
      return sendResponse({
        responsecode: Responses.INVALID_REQUEST.responsecode,
        responsemessage: 'Failed to decrypt data',
        error: error.message
      });
    }
  }

}
