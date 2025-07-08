import { Injectable, Logger } from '@nestjs/common';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';
import { CryptoRateUtil } from 'src/common/utils/crypto-rate.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit, DepositDocument } from './entities/deposit.entity';
import { DepositConfirmService } from './deposit-confirm.service';

@Injectable()
export class DepositScanService {
  private readonly logger = new Logger(DepositScanService.name);
  private readonly ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY!;
  private readonly ETHERSCAN_BASE_URL = process.env.ETHERSCAN_BASE_URL;
   private readonly BTCSCAN_BASE_URL = process.env.BTCSCAN_BASE_URL;

  constructor(
    private readonly http: HttpRequestUtil,
    private readonly cryptoRate: CryptoRateUtil,
    private readonly confirmService: DepositConfirmService,
    @InjectModel(Deposit.name)
    private readonly depositModel: Model<DepositDocument>,
  ) {}

  // async scanEthAddress(address: string) {
  //   const lowerAddr = address;
  //   const url = `${this.ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&apikey=${this.ETHERSCAN_API_KEY}`;
  //   console.log('url',url)
  //   const res = await this.http.get<any>(url);

  //   if (!res || res.message !== 'OK') {
  //     this.logger.warn(`Etherscan error: ${res?.message || 'No response'}`);
  //     return {
  //       responsecode: '22',
  //       responsemessage: res?.message || 'Unable to complete request',
  //     };
  //   }

  //   const txs = res.result;
  //   if (!txs || txs.length === 0) {
  //     return {
  //       responsecode: '22',
  //       responsemessage: 'No transactions found for this address.',
  //     };
  //   }

  //   // Get last confirmed txHash for this address
  //   const lastConfirmed = await this.depositModel
  //     .findOne({ depositAddress: lowerAddr, status: 'confirmed' })
  //     .sort({ confirmedAt: -1 });

  //   const lastHash = lastConfirmed?.txHash

  //   // Filter transactions sent TO this address and after the last confirmed one
  //   const newDeposits: Record<string, any>[] = [];

  //   let foundLastHash = false;
  //   console.log("txcn",txs.length);
  //   const ethRate = await this.cryptoRate.getEthUsdRate();
  //   let txIndex=0
  //   for (const tx of txs.reverse()) {
  //       txIndex++;
  //   // for (const tx of txs) {
  //     if (tx.to !== lowerAddr) continue;

  //     if (lastHash && tx.hash === lastHash) {
  //       foundLastHash = true;
  //       continue;
  //     }

  //     if (lastHash && !foundLastHash) continue;

  //     const ethAmount = parseFloat(tx.value) / 1e18;
      
  //     const usdAmount = ethAmount * (ethRate || 0);
  //     const confirmations = parseInt(tx.confirmations || '0');

  //     const payload = {
  //       method: 'ETH',
  //       hash: tx.hash,
  //       depositAddress: lowerAddr,
  //       ccyAmount: ethAmount,
  //       amountUsd: usdAmount,
  //       ccyValue: ethRate?ethRate:0,
  //       confirmations,
  //       receiveFromAddress: tx.from?.toLowerCase(),
  //       txIndex,
  //       txDate:tx.timeStamp
  //     };

  //     const result = await this.confirmService.confirmDeposit(payload);
  //     this.logger.log(`Processed ETH ${txIndex} ${tx.to} TX ${tx.hash}: ${result.responsemessage}`);
  //     newDeposits.push(result);
  //   }

  //   return {
  //     responsecode: '00',
  //     responsemessage: `${newDeposits.length} ETH transactions processed.`,
  //     data: newDeposits,
  //   };
  // }

  async scanEthAddress(address: string) {
  const lowerAddr = address;
  const url = `${this.ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${lowerAddr}&apikey=${this.ETHERSCAN_API_KEY}`;
  console.log('url', url);

  let res;
  try {
    res = await this.http.get<any>(url);
  } catch (err) {
    this.logger.error('Failed to reach Etherscan', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching Etherscan.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`Etherscan error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = res.result;
  if (!txs || txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No transactions found for this address.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  const newDeposits: Record<string, any>[] = [];
  let foundLastHash = !lastHash; // If no last hash, start from beginning

  const ethRate = await this.cryptoRate.getEthUsdRate();
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;

    if (!tx.to || tx.to !== lowerAddr) continue;
    if (tx.to === tx.from) continue;

    if (lastHash && tx.hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const ethAmount = parseFloat(tx.value) / 1e18;
    const usdAmount = ethAmount * (ethRate ?? 0);
    const confirmations = parseInt(tx.confirmations || '0');

    const payload = {
      method: 'ETH',
      hash: tx.hash,
      depositAddress: lowerAddr,
      ccyAmount: ethAmount,
      amountUsd: usdAmount,
      ccyValue: ethRate ?? 0,
      confirmations,
      receiveFromAddress: tx.from,
      txIndex,
      txDate: tx.timeStamp,
      transactionIndex:tx.transactionIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed ETH #${txIndex} → ${tx.to}: ${tx.hash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  return {
    responsecode: '00',
    responsemessage: `${newDeposits.length} ETH transactions processed.`,
    data: newDeposits,
  };
  }

  async scanBtcAddress(address: string) {
  const lowerAddr = address;
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${lowerAddr}/full`;
  console.log('url', url);

  let res;
  try {
    res = await this.http.get<any>(url);
  } catch (error) {
    this.logger.warn(`BlockCypher error: ${error?.message || 'Request failed'}`);
    return {
      responsecode: '22',
      responsemessage: 'Unable to reach BlockCypher API. Please try again later.',
    };
  }

  if (!res?.data?.txs || !Array.isArray(res.data.txs)) {
    const errorMessage = res?.data?.error || 'No transaction data available';
    this.logger.warn(`BlockCypher error: ${errorMessage}`);
    return {
      responsecode: '22',
      responsemessage: errorMessage,
    };
  }

  const txs = res.data.txs;
  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const btcRate = await this.cryptoRate.getBtcUsdRate();
  let txIndex = 0;
  const newDeposits: Record<string, any>[] = [];

  for (const tx of txs) {
    txIndex++;
    const hash = tx.hash;
    const confirmations = tx.confirmations;
    const outputs = tx.outputs;

    for (const output of outputs) {
      const toAddresses = output.addresses || [];
      const match = toAddresses.includes(lowerAddr);
      if (!match) continue;

      const satoshis = output.value;
      const btcAmount = satoshis / 1e8;
      const usdAmount = btcAmount * (btcRate ?? 0);

      const payload = {
        method: 'BTC',
        hash,
        depositAddress: lowerAddr,
        ccyAmount: btcAmount,
        amountUsd: usdAmount,
        ccyValue: btcRate ?? 0,
        confirmations,
        receiveFromAddress: tx.inputs?.[0]?.addresses?.[0] ?? null,
        txIndex,
        txDate: tx.received,
        transactionIndex: tx.transactionIndex,
      };

      const result = await this.confirmService.confirmDeposit(payload);
      this.logger.log(`Processed BTC #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
      newDeposits.push(result);
    }
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} BTC transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
}


  async scanUsdtErc20Address(address: string) {
  const lowerAddr = address.toLowerCase();
  const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&address=${lowerAddr}&apikey=${this.ETHERSCAN_API_KEY}`;

  let res;
  try {
    res = await this.http.get<any>(url);
  } catch (err) {
    this.logger.error('Failed to reach Etherscan', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching Etherscan.',
    };
  }

  if (!res || res.data?.message !== 'OK') {
    const msg = res?.data?.message || 'Unable to complete request. Please try again later';
    this.logger.warn(`USDT Etherscan error: ${msg}`);
    return {
      responsecode: '22',
      responsemessage: msg,
    };
  }

  const results = res.data.result;
  if (!results || results.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const newDeposits: Record<string, any>[] = [];
  let txIndex = 0;

  for (const tx of results) {
    const to = tx.to?.toLowerCase();
    if (to !== lowerAddr) continue;

    txIndex++;
    const hash = tx.hash;
    const confirmations = parseInt(tx.confirmations || '0');
    const usdtAmount = parseFloat(tx.value) / 1e6; // 6 decimals for USDT

    const payload = {
      method: 'USDTERC20',
      hash,
      depositAddress: lowerAddr,
      ccyAmount: usdtAmount,
      amountUsd: usdtAmount,
      ccyValue: 1,
      confirmations,
      receiveFromAddress: tx.from?.toLowerCase(),
      txIndex,
      txDate: tx.timeStamp,
      transactionIndex: tx.transactionIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed USDT #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} USDT transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
}




}
