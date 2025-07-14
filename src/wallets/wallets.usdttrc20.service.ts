import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as hdkey from 'hdkey';
import TronWeb from 'tronweb';
import { Buffer } from 'buffer';

@Injectable()
export class WalletsUSDTTRC20Service {
  generateTronWalletFromMnemonic(mnemonic: string, index = 0) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = hdkey.fromMasterSeed(seed);
    const path = `m/44'/195'/0'/0/${index}`;
    const child = root.derive(path);

    const privateKeyBuffer = child.privateKey;

    if (!privateKeyBuffer || !(privateKeyBuffer instanceof Buffer)) {
      throw new Error('Invalid private key generated.');
    }

    // Convert private key Buffer to Uint8Array
    const privateKeyBytes = new Uint8Array(privateKeyBuffer);

    const rawAddress = TronWeb.utils.crypto.getAddressFromPriKey(privateKeyBytes);
    const base58Address = TronWeb.utils.crypto.getBase58CheckAddress(rawAddress);

    return {
      path,
      address: base58Address,
      privateKey: privateKeyBuffer.toString('hex'),
      publicKey: child.publicKey.toString('hex'),
    };
  }
}
