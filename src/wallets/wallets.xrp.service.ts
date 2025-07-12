import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as edHd from 'ed25519-hd-key';
import * as rippleKeypairs from 'ripple-keypairs';
import * as bs58check from 'bs58check';

@Injectable()
export class WalletsXrpService {
  generateNewMnemonic(): string {
    return bip39.generateMnemonic();
  }

  generateXrpWallet(mnemonic: string, index = 0) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const path = `m/44'/144'/0'/0/${index}`;
    const { key } = edHd.derivePath(path, seed.toString('hex'));

    const keypair = rippleKeypairs.deriveKeypair(key.toString('hex'));
    const address = rippleKeypairs.deriveAddress(keypair.publicKey);

    return {
      path,
      address,
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    };
  }
}
