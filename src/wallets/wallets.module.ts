import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { AddressesService } from './address.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Address, AddressSchema } from './entities/address.entity';
import { WalletsBtcService } from './wallets.btc.service';
import { AddressBtc, AddressBtcSchema } from './entities/address.btc.entity';
import { AddressUSDTERC20, AddressUSDTERC20Schema } from './entities/address.usdterc20.entity';
import { WalletsLtcService } from './wallets.ltc.service';
import { AddressLtc, AddressLtcSchema } from './entities/address.ltc.entity';
import { WalletsSolanaService } from './wallets.sol.service';
import { AddressSol, AddressSolSchema } from './entities/address.sol.entity';
import { AddressUSDTTRC20, AddressUSDTTRC20Schema } from './entities/address.usdttrc20.entity';
import { WalletsUSDTTRC20Service } from './wallets.usdttrc20.service';
import { WalletsBchService } from './wallets.bch.service';
import { AddressBch, AddressBchSchema } from './entities/address.bch.entity';
import { AddressXrp, AddressXrpSchema } from './entities/address.xrp.entity';
import { WalletsXrpService } from './wallets.xrp.service';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema, },{ name: Address.name, schema: AddressSchema, },
      { name: AddressBtc.name, schema: AddressBtcSchema, }, { name: AddressUSDTERC20.name, schema: AddressUSDTERC20Schema, },
      { name: AddressUSDTTRC20.name, schema: AddressUSDTTRC20Schema, },{ name: AddressBch.name, schema: AddressBchSchema, },
      { name: AddressLtc.name, schema: AddressLtcSchema, }, { name: AddressSol.name, schema: AddressSolSchema, },
      { name: AddressXrp.name, schema: AddressXrpSchema, }
    ]),
    
  ],
  providers: [WalletsService,WalletsBtcService,WalletsLtcService,WalletsSolanaService,WalletsUSDTTRC20Service,WalletsBchService,WalletsXrpService,HttpRequestUtil, AddressesService],
  controllers: [WalletsController],
  exports: [WalletsService,WalletsBtcService,WalletsLtcService,WalletsSolanaService,WalletsUSDTTRC20Service,WalletsBchService,WalletsXrpService,AddressesService],
})
export class WalletsModule {}
