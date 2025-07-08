import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { HDNodeWallet, Mnemonic } from 'ethers';

@Injectable()
export class WalletsService {
  
 

  generateAddress(mnemonic: string,index: number) {
    const mnemonicObj: Mnemonic= Mnemonic.fromPhrase(mnemonic);;
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = HDNodeWallet.fromMnemonic(mnemonicObj, path);
    return {
      path,
      address: '0x9ce172b3226fac007fc2c322732c04ef6b2a7780',//wallet.address,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    };
  }

  generateNewMnemonic(): string {
    const entropy = randomBytes(16); // 128 bits = 12 words
    const mnemonicObj = Mnemonic.fromEntropy(entropy);
    return mnemonicObj.phrase;
  }
}
