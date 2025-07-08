import { Injectable } from '@nestjs/common';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
@Injectable()
export class WalletsSolanaService {
  generateSolanaAddress(mnemonic: string, index = 0) {

    try{
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    // BIP44 path for Solana (coin_type 501)
    const path = `m/44'/501'/0'/0'/${index}'`; // All hardened segments
    const { key } = derivePath(path, seed.toString('hex'));


    const keypair = Keypair.fromSeed(key);

    return {
      path,
      address: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey), // base58-encoded 64-byte key
      publicKey: keypair.publicKey.toBase58(),
    };
}catch(err){
    console.log("soleroor",err)
    return {
      error:err,
    };
}
  }
}
