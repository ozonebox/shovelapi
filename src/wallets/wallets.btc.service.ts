import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';

const bip32 = BIP32Factory(ecc); //  This gives you .fromSeed()

@Injectable()
export class WalletsBtcService {
  generateNewMnemonic(): string {
    const entropy = randomBytes(16); // 128 bits = 12 words
    return bip39.entropyToMnemonic(entropy.toString('hex'));
  }

  generateBitcoinAddress(mnemonic: string, index: number) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);

  const path = `m/84'/0'/0'/0/${index}`;
  const child = root.derivePath(path);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey), // 
    //  required for bitcoinjs-lib
    network: bitcoin.networks.bitcoin,
  });

  return {
    path,
    address,
    publicKey: Buffer.from(child.publicKey).toString('hex'), // 
    
    privateKey: child.toWIF(),
  };
}

}
