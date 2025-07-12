import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from './entities/address.entity';
import { WalletsService } from 'src/wallets/wallets.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { WalletsBtcService } from './wallets.btc.service';
import { AddressBtc, AddressBtcDocument } from './entities/address.btc.entity';
import { AddressUSDTERC20, AddressUSDTERC20Document } from './entities/address.usdterc20.entity';
import { AddressLtc, AddressLtcDocument } from './entities/address.ltc.entity';
import { WalletsLtcService } from './wallets.ltc.service';
import { WalletsSolanaService } from './wallets.sol.service';
import { AddressSol, AddressSolDocument } from './entities/address.sol.entity';
import { AddressUSDTTRC20, AddressUSDTTRC20Document } from './entities/address.usdttrc20.entity';
import { AddressBch, AddressBchDocument } from './entities/address.bch.entity';
import { WalletsBchService } from './wallets.bch.service';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';
import { AddressXrp, AddressXrpDocument } from './entities/address.xrp.entity';
import { WalletsXrpService } from './wallets.xrp.service';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);
  private readonly CRYPTOAPI_BASE_URL = process.env.CRYPTOAPI_BASE_URL;
  private readonly CRYPTOAPI_API_KEY = process.env.CRYPTOAPI_API_KEY!;
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(AddressBtc.name) private addressBtcModel: Model<AddressBtcDocument>,
    @InjectModel(AddressUSDTERC20.name) private addressUsdterc20Model: Model<AddressUSDTERC20Document>,
    @InjectModel(AddressLtc.name) private addressLtcModel: Model<AddressLtcDocument>,
    @InjectModel(AddressSol.name) private addressSolModel: Model<AddressSolDocument>,
    @InjectModel(AddressUSDTTRC20.name) private addressUsdttrc20Model: Model<AddressUSDTTRC20Document>,
    @InjectModel(AddressBch.name) private addressBchModel: Model<AddressBchDocument>,
    @InjectModel(AddressXrp.name) private addressXrpModel: Model<AddressXrpDocument>,
    private readonly walletsService: WalletsService,
    private readonly walletsBtcService: WalletsBtcService,
    private readonly walletsLtcService: WalletsLtcService,
    private readonly walletsSolanaService: WalletsSolanaService,
    private readonly walletsBchService: WalletsBchService,
    private readonly walletsXrpService: WalletsXrpService,
    private readonly http: HttpRequestUtil,
  ) {}

  async generateAndStoreAddress(transObj: any,mnemonic:string,type:string,) {
   
    // Get the next index for this user
    const count = await this.addressModel.countDocuments({
      userId:transObj.userId,
      network: { $in: ['ETH'] },
    });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsService.generateAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'ETH',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

  async generateAndStoreUSDTAddress(transObj: any,mnemonic:string,type:string,) {
   
    // Get the next index for this user
    const count = await this.addressUsdterc20Model.countDocuments({
       userId:transObj.userId,
      network: { $in: ['USDTERC20'] },
    });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsService.generateAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressUsdterc20Model.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'USDTERC20',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

   async generateAndStoreUSDTTRC20Address(transObj: any,mnemonic:string,type:string,) {
   
    // Get the next index for this user
    const count = await this.addressUsdttrc20Model.countDocuments({
       userId:transObj.userId,
      network: { $in: ['USDTTRC20'] },
    });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsService.generateAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressUsdttrc20Model.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'USDTTRC20',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

  async generateAndStoreBtcddress(transObj: any,mnemonic:string,type:string) {
   
    // Get the next index for this user
    const count = await this.addressBtcModel.countDocuments({  userId:transObj.userId,network:'BTC' });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsBtcService.generateBitcoinAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressBtcModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'BTC',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

  async generateAndStoreLtcddress(transObj: any,mnemonic:string,type:string) {
   
    // Get the next index for this user
    const count = await this.addressLtcModel.countDocuments({  userId:transObj.userId,network:'LTC' });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsLtcService.generateLitecoinAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressLtcModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'LTC',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

   async generateAndStoreSoladdress(transObj: any,mnemonic:string,type:string) {
   
    // Get the next index for this user
    const count = await this.addressSolModel.countDocuments({  userId:transObj.userId,network:'SOL' });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsSolanaService.generateSolanaAddress(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressSolModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'SOL',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

  async generateAndStoreBchddress(transObj: any,mnemonic:string,type:string) {
   
    // Get the next index for this user
    const count = await this.addressBchModel.countDocuments({  userId:transObj.userId,network:'BCH' });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsBchService.generateBchWalletFromMnemonic(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressBchModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'BCH',
      isUsed: false,
      type:type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

   async generateAndStoreXrpaddress(transObj: any,mnemonic:string,type:string,) {
   
    // Get the next index for this user
    const count = await this.addressXrpModel.countDocuments({  userId:transObj.userId,network:'XRP' });
    const index = count; // Start at 0, 1, 2, etc.

    // Generate wallet address using WalletsService
    const wallet = this.walletsXrpService.generateXrpWallet(mnemonic,index);

    // Store the generated address
    try{

    
    const newAddress = await this.addressXrpModel.create({
      userId:transObj.userId,
      transactionId:transObj._id.toString(),
      custTransactionReference:transObj.custTransactionReference,
      transactionReference:transObj.transactionReference,
      address: wallet.address,
      index,
      path: wallet.path,
      network: 'XRP',
      isUsed: false,
      type: type,
    });

    return {
      address: newAddress.address,
      network: newAddress.network,
      path: newAddress.path,
      index: newAddress.index,
      status:true,
      addressId:newAddress._id?.toString() ?? '',
    };
    }catch(err){
        return {
        status:false,
        error:err
    };
    }
  }

  async createEvenEventTransaction(address:string,blockchain:string,coin:string,confirmation:string){
    const network='mainnet';
    let url=''
    
    if(blockchain=='bitcoin'||blockchain=='bitcoin-cash'||blockchain=='litecoin'||blockchain=='xrp'){
       url= `${this.CRYPTOAPI_BASE_URL}/blockchain-events/${blockchain}/${network}/address-coins-transactions-confirmed-each-confirmation`;
       if(confirmation=="unconfirmed"){
         url = `${this.CRYPTOAPI_BASE_URL}/blockchain-events/${blockchain}/${network}/address-coins-transactions-unconfirmed`;
      }
    
    }
    if(blockchain=='ethereum'||blockchain=="tron"){
       url= `${this.CRYPTOAPI_BASE_URL}/blockchain-events/${blockchain}/${network}/address-tokens-transactions-confirmed-each-confirmation`;
       if(coin=="ethereum"){
         url = `${this.CRYPTOAPI_BASE_URL}/blockchain-events/${blockchain}/${network}/address-coins-transactions-unconfirmed`;
      }
    
      
    }
     if(blockchain=='solana'){
       url= `${this.CRYPTOAPI_BASE_URL}/blockchain-events/${blockchain}/${network}/address-coins-transactions-confirmed`;
      
    
    }
   
   

    let body={
        context: "ex",
        data: {
            item: {
                address: address,
                allowDuplicates: false,
                callbackSecretKey: this.CRYPTOAPI_API_KEY,
                callbackUrl: "https://shovel.cash/index.php",
                confirmationsCount: 3
            }
        }
      } 
    console.log('CryptoApi URL:', url);
    console.log('body:', body);

    let res;
    try {
      res = await this.http.postCryptoApi<any>(url,body); // include headers
    } catch (err) {
      this.logger.error('Failed to reach CryptoApi', err);
      return {
        responsecode: '22',
        responsemessage: 'Error reaching CryptoApi.',
      };
    }

    if (!res || res.message !== 'OK') {
      this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
      return {
        responsecode: '22',
        responsemessage: res?.message || 'Unable to complete request',
      };
    }
    this.logger.log(`CryptoApi success: ${res || 'empty response'}`);
    }

  async getAddressByType(address: string, depositType: string) {
  switch (depositType.toUpperCase()) {
    case 'ETH':
      return await this.addressModel.findOne({ address });

    case 'USDTERC20':
      return await this.addressUsdterc20Model.findOne({ address });

    case 'USDTTRC20':
      return await this.addressUsdttrc20Model.findOne({ address });

    case 'BTC':
      return await this.addressBtcModel.findOne({ address });

    case 'LTC':
      return await this.addressLtcModel.findOne({ address });

    case 'SOL':
      return await this.addressSolModel.findOne({ address });

    case 'BCH':
      return await this.addressBchModel.findOne({ address });

    case 'XRP':
      return await this.addressXrpModel.findOne({ address });

    default:
      throw new NotFoundException(`Unsupported address type: ${depositType}`);
  }
}

    


}
