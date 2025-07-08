import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';

const bip32 = BIP32Factory(ecc);

// Litecoin network parameters
const litecoinNetwork = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

@Injectable()
export class WalletsLtcService {
  generateNewMnemonic(): string {
    return bip39.generateMnemonic();
  }

  generateLitecoinAddress(mnemonic: string, index: number) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed, litecoinNetwork);
    const path = `m/84'/2'/0'/0/${index}`; // BIP84, coin_type 2 for Litecoin

    const child = root.derivePath(path);

    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: litecoinNetwork,
    });

    return {
      path,
      address,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      privateKey: child.toWIF(),
    };
  }
}
