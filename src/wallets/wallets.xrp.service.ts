import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as edHd from 'ed25519-hd-key';
import * as nacl from 'tweetnacl';
import * as rippleKeypairs from 'ripple-keypairs';

@Injectable()
export class WalletsXrpService {
  generateNewMnemonic(): string {
    return bip39.generateMnemonic();
  }

  generateXrpWallet(mnemonic: string, index = 0) {
    const seed = bip39.mnemonicToSeedSync(mnemonic); // Buffer

    // XRP BIP44 derivation path — all segments hardened
    const path = `m/44'/144'/0'/0'/${index}'`;
    const { key } = edHd.derivePath(path, seed.toString('hex')); // key is 32-byte Buffer

    // 🔐 Derive keypair using tweetnacl
    const keypair = nacl.sign.keyPair.fromSeed(key); // returns { publicKey, secretKey }

    const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex');
    const privateKeyHex = Buffer.from(keypair.secretKey.slice(0, 32)).toString('hex'); // use seed part only

    // ✅ Now derive address from public key using ripple-keypairs
    const address = rippleKeypairs.deriveAddress(publicKeyHex);

    return {
      mnemonic,
      path,
      address,
      publicKey: publicKeyHex,
      privateKey: privateKeyHex
    };
  }
}
