import { Wallet } from 'ethers';

const wallet = Wallet.createRandom();
console.log("Your 12-word mnemonic:\n", wallet.mnemonic?.phrase);
