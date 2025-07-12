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
import { TransactionAuth, TransactionAuthDocument } from './entities/transactionauth.entities';
import { CreateTransactionAuthDto } from './dto/create-transaction-auth.dto';
import { CryptoRateUtil } from 'src/common/utils/crypto-rate.util';
import { IncomingHooks, IncomingHooksDocument } from 'src/deposits/entities/incominghooks.entity';


@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(TransactionAuth.name) private transactionAuthModel: Model<TransactionAuthDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
     @InjectModel(IncomingHooks.name) private incomingHooks: Model<IncomingHooksDocument>,
    private readonly addressesService: AddressesService,
    private readonly secretsService: SecretsService,
    private readonly sqsService: SqsService,
    private readonly encryptionService: EncryptionService,
    private readonly authService: AuthService,
    private readonly cryptoRate: CryptoRateUtil,

  ) {}

  async initiateDeposit(dto: CreateTransactionDto) {
    const { custTransactionReference,emailAddress, depositType, depositAmountUsd,paymentName,paymentImageUrl,encCustTransactionReference,token } = dto;
    let email;

    if(token){
      try{
        const decrypt=await this.authService.verifyToken(token);
        console.log('decrypt',decrypt)
      
        if(decrypt.isVerified=="true"){
          email=decrypt.email;
        }
      }catch(error){

      }
      
    }
    if(emailAddress){
      email = emailAddress.toLowerCase();
    }
     
    if(!email){
      return sendResponse({
        responsecode: Responses.DDECRYPT_USER_NOT_FOUND.responsecode,
        responsemessage: Responses.DDECRYPT_USER_NOT_FOUND.responsemessage,
      });
    }
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
      let existingTransaction = await this.transactionModel.findOne({
        encCustTransactionReference
      });

     if (!existingTransaction) {
        const transaction = await this.transactionModel.create({
          userId: user._id,
          custTransactionReference,
          encCustTransactionReference,
          depositAmountUsd,
          depositType,
          paymentName,
          paymentImageUrl,
          status: 'pending'
        });

        if (!transaction || !transaction._id) {
          return sendResponse({
            responsecode: Responses.TRANSACTION_CREATE_ERROR.responsecode,
            responsemessage: Responses.TRANSACTION_CREATE_ERROR.responsemessage,
          });
        }

        existingTransaction= transaction;
      }



      
      const mnemonic = await this.secretsService.getMnemonic(walletpath+user.userMnem);
        if (!mnemonic) {
          return sendResponse({
            responsecode: Responses.MNEMONIC_NOT_FOUND.responsecode,
            responsemessage: Responses.MNEMONIC_NOT_FOUND.responsemessage,
          });
        }
        const transType=dto.depositType;
        let addressInfo:any;
        let transObj=existingTransaction.toJSON();
        let rate = 0;
        
        if(transType=="ETH"){
          addressInfo= await this.addressesService.generateAndStoreAddress(transObj, mnemonic.mnemonic,'deposit');
          const ethRate = await this.cryptoRate.getEthUsdRate();
          rate=ethRate ?? 0
        }else if(transType=="USDTERC20"){
          addressInfo= await this.addressesService.generateAndStoreUSDTAddress(transObj, mnemonic.mnemonic,'deposit');
          const usdtRate = await this.cryptoRate.getUsdtUsdRate();
          rate=usdtRate ?? 0
        }else if(transType=="USDTTRC20"){
          addressInfo= await this.addressesService.generateAndStoreUSDTTRC20Address(transObj, mnemonic.mnemonic,'deposit');
          const usdtRate = await this.cryptoRate.getUsdtUsdRate();
          rate=usdtRate ?? 0
        }else if(transType=="LTC"){
          addressInfo= await this.addressesService.generateAndStoreLtcddress(transObj, mnemonic.mnemonic,'deposit');
          const ltcRate = await this.cryptoRate.getLtcUsdRate();
          rate=ltcRate ?? 0
        }else if(transType=="BTC"){
            addressInfo= await this.addressesService.generateAndStoreBtcddress(transObj, mnemonic.mnemonic,'deposit');
            const btcRate = await this.cryptoRate.getBtcUsdRate();
            rate=btcRate ?? 0
        }else if(transType=="SOL"){
            addressInfo= await this.addressesService.generateAndStoreSoladdress(transObj, mnemonic.mnemonic,'deposit');
             const solRate = await this.cryptoRate.getSolUsdRate();
            rate=solRate ?? 0
        }else if(transType=="BCH"){
            addressInfo= await this.addressesService.generateAndStoreBchddress(user._id.toString(), mnemonic.mnemonic,'deposit');
            const bchRate = await this.cryptoRate.getBchUsdRate();
            rate=bchRate ?? 0
        }else if(transType=="XRP"){
            addressInfo= await this.addressesService.generateAndStoreXrpaddress(user._id.toString(), mnemonic.mnemonic,'deposit');
            const xrpRate = await this.cryptoRate.getXrpUsdRate();
            rate=xrpRate ?? 0
        }
        // Generate and store the address
        
        if(addressInfo.status){
          // Check if any transaction in the DB already contains this address + depositType
          const duplicateAddress = await this.transactionModel.findOne({
            depositAddress: {
              $elemMatch: {
                address: addressInfo.address,
                depositType: addressInfo.network
              }
            }
          });

          if (duplicateAddress) {
            return sendResponse({
              responsecode: Responses.DUPLICATE_ADDRESS.responsecode,
              responsemessage: Responses.DUPLICATE_ADDRESS.responsemessage,
              data: {
                transactionId: duplicateAddress._id,
                address: addressInfo.address,
                depositType: addressInfo.network
              }
            });
          }
          const depositAmount=depositAmountUsd/rate;
          existingTransaction.depositAmount=existingTransaction.depositAmount||depositAmount;
          existingTransaction.rate=rate;
            let addrs={
              index:existingTransaction.depositAddress.length,
              address:addressInfo.address,
              addressId:addressInfo.addressId,
              currency:addressInfo.network,
              addressIndex:addressInfo.index,
              depositType:addressInfo.network,
              depositAmount:depositAmount,
              rate:rate,
              depositAmountUsd:depositAmountUsd,
              createdAt:new Date(),
              depositAddressQr:'http://localhost:3010/transactions/generate?data='+addressInfo.address,
            }
            existingTransaction.depositAddress = existingTransaction.depositAddress || [];
            existingTransaction.depositAddress.push(addrs);         
          
            
            await existingTransaction.save();
            const existingTransactionQueue = {
              ...existingTransaction.toObject(),
              depositAddress: [addrs]
            };
            let queueObj={
              id: existingTransactionQueue._id,
              body: existingTransactionQueue,
              delaySeconds: 3, // Delay processing for 1 minute
            }
            await this.sqsService.sendToQueue(process.env.DEPOSIT_SCAN_QUEUE_URL!, queueObj);
            //jwt,encrypt
            let obj={
              ...existingTransaction.toObject(),
              depositAddressQr:'http://localhost:3010/transactions/generate?data='+addrs.address,
              deposits:[]
            }
            
            return sendResponse({
            responsecode: Responses.DEPOSIT_ADDRESS_CREATED.responsecode,
            responsemessage: Responses.DEPOSIT_ADDRESS_CREATED.responsemessage,
            data: obj,
            });

          
        }else{
          existingTransaction.depositAddress=existingTransaction.depositAddress || [];
          await existingTransaction.save();
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
    token,
    emailAddress,
    transactionReference,
    custTransactionReference,
    encCustTransactionReference,
    depositAddress,
  } = dto;

  let email;

  if(token){
    try{
      const decrypt=await this.authService.verifyToken(token);
      console.log('decrypt',decrypt)
    
      if(decrypt.isVerified=="true"){
        email=decrypt.email;
      }
    }catch(error){

    }
    
  }
  if(emailAddress){
    email = emailAddress.toLowerCase();
  }
    
  if(!email){
    return sendResponse({
      responsecode: Responses.DDECRYPT_USER_NOT_FOUND.responsecode,
      responsemessage: Responses.DDECRYPT_USER_NOT_FOUND.responsemessage,
    });
  }

  if (!transactionReference && !encCustTransactionReference&& !custTransactionReference && !depositAddress) {
    return sendResponse({
      responsecode: Responses.GET_TRANS_ERROR.responsecode,
      responsemessage: Responses.GET_TRANS_ERROR.responsemessage,
    });
  }

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
    if (encCustTransactionReference) {
      console.log('filter encCustTransactionReference ',encCustTransactionReference)
      filter.encCustTransactionReference = encCustTransactionReference;
    }
    if (depositAddress) {
      filter.depositAddress = depositAddress.toLowerCase();
    }

    let transactions = await this.transactionModel.find(filter);
    console.log('transactions',filter)
    if (!transactions || transactions.length === 0) {
      return sendResponse({
        responsecode: Responses.TRANSACTION_NOT_FOUND.responsecode,
        responsemessage: Responses.TRANSACTION_NOT_FOUND.responsemessage,
      });
    }
     console.log('transactions',transactions)
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
          depositAddressQr:'http://localhost:3010/transactions/generate?data='+tx.depositAddress
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
        status:'expired',
      });
      }
    } catch (error) {
      console.log('error',encrypted+" >>"+error)
      return sendResponse({
        responsecode: Responses.INVALID_REQUEST.responsecode,
        responsemessage: 'Failed to decrypt data',
        status:'expired',
        error: error.message
      });
    }
  }

  async prepareDeposit(dto: CreateTransactionAuthDto) {
    const { custTransactionReference,emailAddress, depositAmountUsd,paymentName,paymentImageUrl, } = dto;
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
      const transaction = await this.transactionAuthModel.create({
        userId: user._id,
        custTransactionReference,
        depositAmountUsd: depositAmountUsd,
        paymentName,
        paymentImageUrl,
        status: 'pending',
      });

        
          
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
        transaction.paymentLink=encyrptedval;
        await transaction.save();
        return sendResponse({
        responsecode: Responses.DEPOSIT_AUTH_CREATED.responsecode,
        responsemessage: Responses.DEPOSIT_AUTH_CREATED.responsemessage,
        data: {
          custTransactionReference,
          depositAmountUsd,
          encyrptedVal:encyrptedval,
          paymentlink,
        },
        });

          
          


          
     
    }catch(err){
          return sendResponse({
          responsecode: Responses.GENERIC_ERROR.responsecode,
          responsemessage: Responses.GENERIC_ERROR.responsemessage,
          error:err,
      
      });
      }
  }

  async receiveMessage(dto: any) {
    const { referenceId,data, } = dto;
    const newHook = await this.incomingHooks.create({
          fromQueue: dto,
        });
      await newHook.save();
      const depositAddress = dto?.data.item.address;
      console.log("depositAddress>>>",depositAddress)
    try{
       newHook.referenceId=dto?.referenceId;
      newHook.currentConfirmations=dto?.data.item.currentConfirmations;
      newHook.targetConfirmations=dto?.data.item.targetConfirmations;
      newHook.depositAmount=dto?.data.item.amount??dto?.data.item.token.amount;
      newHook.depositType=dto?.data.item.unit??dto?.data.item.tokenType;
      newHook.direction=dto?.data.item.direction;
      newHook.depositAddress=dto?.data.item.address;
      await newHook.save();
      let depositType="";
      
      if(dto?.data.item?.unit=='BTC'){
        depositType=dto?.data.item?.unit;
        
      }
      if(dto?.data.item?.unit=='ETH'){
        depositType=dto?.data.item?.unit;
      }
      if(dto?.data.item?.unit=='BCH'){
        depositType=dto?.data.item?.unit;
      }
      if(dto?.data.item?.unit=='LTC'){
        depositType=dto?.data.item?.unit;
      }
      if(dto?.data.item?.unit=='SOL'){
        depositType=dto?.data.item?.unit;
      }
      if(dto?.data.item?.unit=='XRP'){
        depositType=dto?.data.item?.unit;
      }
      if(dto?.data.item?.tokenType=='ERC-20'){
        depositType='USDTERC20';
      }
      if(dto?.data.item?.tokenType=='TRC-20'){
        depositType='USDTTRC20';
        
      }
     
      if(depositType=""){
        return sendResponse({
          responsecode: Responses.COIN_OR_TOKEN_UNRECOGNIZED.responsecode,
          responsemessage: Responses.COIN_OR_TOKEN_UNRECOGNIZED.responsemessage,
        
      
        });
      }
       newHook.depositType=depositType;
      const isMyAddress = await this.addressesService.getAddressByType(newHook.depositAddress,depositType)
      if(isMyAddress){
        newHook.userId=isMyAddress.userId;
        newHook.addressIndex=isMyAddress.index;
        newHook.addressId=isMyAddress._id?.toString() ?? '',
        newHook.custTransactionReference=isMyAddress.custTransactionReference;
        newHook.transactionReference=isMyAddress.transactionReference;
          let queueObj={
              id: newHook.referenceId,
              body: newHook,
              delaySeconds: 3, // Delay processing for 1 minute
            }
            await this.sqsService.sendToQueue(process.env.MAIN_DEPOSIT_SCAN_QUEUE_URL!, queueObj);
            newHook.procResult='good address';
      }else{
        newHook.procResult='unrecognised address';
      }
        await newHook.save();
        return sendResponse({
        responsecode: Responses.DEPOSIT_AUTH_CREATED.responsecode,
        responsemessage: Responses.DEPOSIT_AUTH_CREATED.responsemessage,
        
        });

          
          


          
     
    }catch(err){
          return sendResponse({
          responsecode: Responses.GENERIC_ERROR.responsecode,
          responsemessage: Responses.GENERIC_ERROR.responsemessage,
          error:err,
      
      });
      }
  }

}
