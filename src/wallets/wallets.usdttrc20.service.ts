import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as hdkey from 'hdkey';
const TronWeb = require('tronweb');
@Injectable()
export class WalletsUSDTTRC20Service {
  
 
 generateTronWalletFromMnemonic(mnemonic: string, index = 0) {
    
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = hdkey.fromMasterSeed(seed);
    
    const path = `m/44'/195'/0'/0/${index}`; // SLIP-0044 coin_type 195 for TRON
    const child = root.derive(path);

    const privateKey = child.privateKey.toString('hex');
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    const address = tronWeb.address.fromPrivateKey(privateKey);

    return {
        path,
        address,
        privateKey,
        publickKey:"",
    };
    }

}

 
