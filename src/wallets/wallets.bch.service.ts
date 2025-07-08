import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as bitcore from 'bitcore-lib-cash';
import * as cashaddr from 'cashaddrjs';

@Injectable()
export class WalletsBchService {
  generateBchWalletFromMnemonic(mnemonic: string, index = 0) {
    const bip32 = require('bip32');
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);

    const path = `m/44'/145'/0'/0/${index}`;
    const child = root.derivePath(path);

    const privateKeyWIF = bitcore.PrivateKey.fromWIF(child.toWIF());
    const bchAddress = privateKeyWIF.toAddress().toString();

    // Optional: convert to CashAddr
    const cashAddress = cashaddr.encode(
      'bitcoincash',
      'P2PKH',
      bitcore.Address.fromString(bchAddress).hashBuffer
    );

    return {
      path,
      legacyAddress: bchAddress,
      address:bchAddress,
      cashAddress,
      publickKey:cashAddress,
      privateKey: privateKeyWIF.toString(),
    };
  }
}
