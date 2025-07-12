import { Injectable, Logger } from '@nestjs/common';
import { HttpRequestUtil } from 'src/common/utils/http-request.util';
import { CryptoRateUtil } from 'src/common/utils/crypto-rate.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit, DepositDocument } from './entities/deposit.entity';
import { DepositConfirmService } from './deposit-confirm.service';

@Injectable()
export class DepositScanCrytpoApiService {
  private readonly logger = new Logger(DepositScanCrytpoApiService.name);
  
  private readonly CRYPTOAPI_BASE_URL = process.env.CRYPTOAPI_BASE_URL;
  private readonly BTCSCAN_BASE_URL = process.env.BTCSCAN_BASE_URL;
  private readonly USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS as string;
  private readonly TRON_USDT_CONTRACT_ADDRESS = process.env.TRON_USDT_CONTRACT_ADDRESS as string;;

  constructor(
    private readonly http: HttpRequestUtil,
    private readonly cryptoRate: CryptoRateUtil,
    private readonly confirmService: DepositConfirmService,
    @InjectModel(Deposit.name)
    private readonly depositModel: Model<DepositDocument>,
  ) {}


  async scanEthAddress(address: string, addressId: string, addressIndex: string) {
  const lowerAddr = address.toLowerCase();
  const url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/evm/ethereum/mainnet/${lowerAddr}/transactions`;


  console.log('ETH Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url); // include headers
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = Array.isArray(res.data?.items) ? res.data.items : [];

  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No transactions found for this address.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: "ETH", status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  const newDeposits: Record<string, any>[] = [];
  let foundLastHash = !lastHash; // If no last hash, allow all

  const ethRate = await this.cryptoRate.getEthUsdRate();
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;

    const recipient = tx.recipient?.toLowerCase();
    const sender = tx.sender?.toLowerCase();
    const txHash = tx.hash;

    if (!recipient || recipient !== lowerAddr) continue;
    if (recipient === sender) continue;

    if (lastHash && txHash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const ethAmount = parseFloat(tx.value.amount) / 1e18;
    const usdAmount = ethAmount * (ethRate ?? 0);
    const confirmations = parseInt(tx.confirmations || '1', 10);

    const payload = {
      method: 'ETH',
      hash: txHash,
      depositAddress: lowerAddr,
      ccyAmount: ethAmount,
      amountUsd: usdAmount,
      ccyValue: ethRate ?? 0,
      confirmations,
      receiveFromAddress: sender,
      txIndex,
      txDate: tx.timestamp,
      transactionIndex: tx.positionInBlock,
      addressId,
      addressIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed ETH #${txIndex} → ${recipient}: ${txHash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  return {
    responsecode: '00',
    responsemessage: `${newDeposits.length} ETH transactions processed.`,
    data: newDeposits,
  };
}



  async scanBtcAddress(address: string, addressId: string, addressIndex: string, conf: number) {
    const lowerAddr = address;
    let url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/bitcoin/mainnet/${lowerAddr}/transactions`;
    if (conf < 1) {
        url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/bitcoin/mainnet/${lowerAddr}/unconfirmed-transactions`;
    }

    console.log('url', url);

    let res;
    try {
        res = await this.http.getCryptoApi<any>(url); // include headers if required
    } catch (err) {
        this.logger.error('Failed to reach CryptoApi', err);
        return {
        responsecode: '22',
        responsemessage: 'Error reaching CryptoApi.',
        };
    }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = Array.isArray(res.data?.items) ? res.data.items : [];
  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'BTC', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const btcRate = await this.cryptoRate.getBtcUsdRate();
  let txIndex = 0;
  const lastHash = lastConfirmed?.txHash;
  const newDeposits: Record<string, any>[] = [];
  let foundLastHash = !lastHash;

  for (const tx of txs) {
    txIndex++;
    const hash = tx.hash;
    const confirmations = conf; // adjust this if you get real confirmation data from block height
    const outputs = tx.recipients || [];

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    let cnt = 0;
    for (const output of outputs) {
      const toAddress = output.address;
      if (toAddress !== lowerAddr) continue;

      const btcAmount = parseFloat(output.value.amount); // Already in BTC
      const usdAmount = btcAmount * (btcRate ?? 0);

      const payload = {
        method: 'BTC',
        hash,
        depositAddress: lowerAddr,
        ccyAmount: btcAmount,
        amountUsd: usdAmount,
        ccyValue: btcRate ?? 0,
        confirmations,
        receiveFromAddress: tx.senders?.[cnt]?.address ?? null,
        txIndex,
        txDate: tx.timestamp,
        transactionIndex: tx.positionInBlock,
        addressId,
        addressIndex,
      };

      const result = await this.confirmService.confirmDeposit(payload);
      this.logger.log(`Processed BTC #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
      newDeposits.push(result);
      cnt++;
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



  async scanUsdtErc20Address(address: string, addressId: string, addressIndex: string) {
  const lowerAddr = address.toLowerCase();
  const url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/evm/ethereum/mainnet/${lowerAddr}/tokens-transfers`;


  console.log('USDT Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url); // ✅ Pass headers
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = (res.data.items || []).filter(
    (item) =>
      item?.tokenData?.contractAddress?.toLowerCase() === this.USDT_CONTRACT_ADDRESS.toLowerCase()
  );

  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'USDTERC20', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  let foundLastHash = !lastHash;
  const newDeposits: Record<string, any>[] = [];
  const usdtRate = await this.cryptoRate.getUsdtUsdRate(); // Usually ~1.0
  let txIndex = 0;

  for (const tx of txs) {
    const to = tx.recipient?.toLowerCase();
    const from = tx.sender?.toLowerCase();
    const hash = tx.hash;

    if (to !== lowerAddr) continue;

    txIndex++;

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const confirmations = parseInt(tx.confirmations || '1', 10);
    const usdtAmount = parseFloat(tx.tokenData?.fungibleValues?.amount || '0') / 1e6;
    const usdAmount = usdtAmount * (usdtRate ?? 1);

    const payload = {
      method: 'USDTERC20',
      hash,
      depositAddress: lowerAddr,
      ccyAmount: usdtAmount,
      amountUsd: usdAmount,
      ccyValue: usdtRate ?? 1,
      confirmations,
      receiveFromAddress: from,
      txIndex,
      txDate: tx.timestamp,
      transactionIndex: tx.minedInBlock?.height ?? 0,
      addressId,
      addressIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed USDTERC20 #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} USDTERC20 transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
  }


  async scanUsdtTrc20Address(address: string, addressId: string, addressIndex: string) {
  const lowerAddr = address.toLowerCase();
  const url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/evm/tron/mainnet/${lowerAddr}/tokens-transfers`;


  console.log('TRC20 Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url);
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = (res.data.items || []).filter(
    (item) =>
      item?.tokenData?.contractAddress?.toLowerCase() === this.TRON_USDT_CONTRACT_ADDRESS.toLowerCase()
  );

  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'USDTTRC20', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  let foundLastHash = !lastHash;

  const newDeposits: Record<string, any>[] = [];
  const usdtRate = await this.cryptoRate.getUsdtUsdRate(); // Usually ~1.0
  let txIndex = 0;

  for (const tx of txs) {
    const to = tx.recipient?.toLowerCase();
    const from = tx.sender?.toLowerCase();
    const hash = tx.hash;

    if (to !== lowerAddr) continue;

    txIndex++;

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const confirmations = parseInt(tx.confirmations || '1', 10);
    const usdtAmount = parseFloat(tx.tokenData?.fungibleValues?.amount || '0') / 1e6;
    const usdAmount = usdtAmount * (usdtRate ?? 1);

    const payload = {
      method: 'USDTTRC20',
      hash,
      depositAddress: lowerAddr,
      ccyAmount: usdtAmount,
      amountUsd: usdAmount,
      ccyValue: usdtRate ?? 1,
      confirmations,
      receiveFromAddress: from,
      txIndex,
      txDate: tx.timestamp,
      transactionIndex: tx.minedInBlock?.height ?? 0,
      addressId,
      addressIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed USDTTRC20 #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} USDTTRC20 transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
}


 async scanSolAddress(address: string, addressId: string, addressIndex: string) {
  const lowerAddr = address.toLowerCase();
  const url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/solana/mainnet/${lowerAddr}/transactions`;

  console.log('SOL Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url); // ✅ Include headers
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = (res.data.items || []).map((item) => ({
    ...item,
    nativeMovements: (item.nativeMovements || []).filter(
      (movement) => movement.recipientAddress?.toLowerCase() === lowerAddr
    ),
  })).filter(tx => tx.nativeMovements.length > 0); // ✅ Only keep txs with matching recipient

  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'SOL', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  let foundLastHash = !lastHash;

  const newDeposits: Record<string, any>[] = [];
  const solRate = await this.cryptoRate.getSolUsdRate();
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;
    const hash = tx.signature;

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const firstMovement = tx.nativeMovements[0];
    const solAmount = parseFloat(firstMovement?.amount || '0') / 1e9; // ✅ Solana uses 9 decimals
    const usdAmount = solAmount * (solRate ?? 0);
    const confirmations = parseInt(tx.confirmations || '1', 10);

    const payload = {
      method: 'SOL',
      hash,
      depositAddress: lowerAddr,
      ccyAmount: solAmount,
      amountUsd: usdAmount,
      ccyValue: solRate ?? 0,
      confirmations,
      receiveFromAddress: firstMovement?.senderAddress?.toLowerCase() ?? null,
      txIndex,
      txDate: tx.timestamp,
      transactionIndex: tx.minedInBlock?.height ?? 0,
      addressId,
      addressIndex,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed SOL #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} SOL transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
    }



 async scanBchAddress(address: string, addressId: string, addressIndex: string, conf: number) {
  const lowerAddr = address.toLowerCase();
  let url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/bitcoin-cash/mainnet/${lowerAddr}/transactions`;

  if (conf < 1) {
    url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/bitcoin-cash/mainnet/${lowerAddr}/unconfirmed-transactions`;
  }

  console.log('BCH Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url,); // ✅ Pass headers explicitly
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = Array.isArray(res.data?.items) ? res.data.items : [];
  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'BCH', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  const bchRate = await this.cryptoRate.getBchUsdRate();
  const newDeposits: Record<string, any>[] = [];

  let foundLastHash = !lastHash;
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;
    const hash = tx.hash;
    const confirmations = tx.confirmations ?? conf;
    const outputs = tx.recipients || [];

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    let cnt = 0;
    for (const output of outputs) {
      const toAddress = output.address?.toLowerCase();
      if (toAddress !== lowerAddr) continue;

      const satoshis = parseFloat(output.value.amount);
      const bchAmount = satoshis / 1e8;
      const usdAmount = bchAmount * (bchRate ?? 0);

      const payload = {
        method: 'BCH',
        hash,
        depositAddress: lowerAddr,
        ccyAmount: bchAmount,
        amountUsd: usdAmount,
        ccyValue: bchRate ?? 0,
        confirmations,
        receiveFromAddress: tx.senders?.[cnt]?.address ?? null,
        txIndex,
        txDate: tx.timestamp,
        transactionIndex: tx.positionInBlock,
        addressId,
        addressIndex,
      };

      const result = await this.confirmService.confirmDeposit(payload);
      this.logger.log(`Processed BCH #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
      newDeposits.push(result);
      cnt++;
    }
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} BCH transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
}

 async scanLtcAddress(address: string, addressId: string, addressIndex: string, conf: number) {
  const lowerAddr = address.toLowerCase();
  let url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/litecoin/mainnet/${lowerAddr}/transactions`;

  if (conf < 1) {
    url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/utxo/litecoin/mainnet/${lowerAddr}/unconfirmed-transactions`;
  }

  console.log('LTC Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url,); // ✅ Pass headers explicitly
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = Array.isArray(res.data?.items) ? res.data.items : [];
  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No deposit found. Kindly contact support if you believe this is a mistake.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: 'LTC', status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  const ltcRate = await this.cryptoRate.getLtcUsdRate();
  const newDeposits: Record<string, any>[] = [];

  let foundLastHash = !lastHash;
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;
    const hash = tx.hash;
    const confirmations = tx.confirmations ?? conf;
    const outputs = tx.recipients || [];

    if (lastHash && hash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    let cnt = 0;
    for (const output of outputs) {
      const toAddress = output.address?.toLowerCase();
      if (toAddress !== lowerAddr) continue;

      const satoshis = parseFloat(output.value.amount);
      const ltcAmount = satoshis / 1e8;
      const usdAmount = ltcAmount * (ltcRate ?? 0);

      const payload = {
        method: 'LTC',
        hash,
        depositAddress: lowerAddr,
        ccyAmount: ltcAmount,
        amountUsd: usdAmount,
        ccyValue: ltcRate ?? 0,
        confirmations,
        receiveFromAddress: tx.senders?.[cnt]?.address ?? null,
        txIndex,
        txDate: tx.timestamp,
        transactionIndex: tx.positionInBlock,
        addressId,
        addressIndex,
      };

      const result = await this.confirmService.confirmDeposit(payload);
      this.logger.log(`Processed LTC #${txIndex} → ${lowerAddr}: ${hash} (${result.responsemessage})`);
      newDeposits.push(result);
      cnt++;
    }
  }

  if (newDeposits.length > 0) {
    return {
      responsecode: '00',
      responsemessage: `${newDeposits.length} LTC transactions processed.`,
      data: newDeposits,
    };
  }

  return {
    responsecode: '22',
    responsemessage: 'No new deposit found. Kindly contact support if you believe this is a mistake.',
  };
 }

   async scanXrpAddress(address: string, addressId: string, addressIndex: string) {
  const lowerAddr = address.toLowerCase();
  const url = `${this.CRYPTOAPI_BASE_URL}/addresses-latest/xrp/mainnet/${lowerAddr}/transactions`;


  console.log('ETH Scan URL:', url);

  let res;
  try {
    res = await this.http.getCryptoApi<any>(url); // include headers
  } catch (err) {
    this.logger.error('Failed to reach CryptoApi', err);
    return {
      responsecode: '22',
      responsemessage: 'Error reaching CryptoApi.',
    };
  }

  if (!res || res.message !== 'OK') {
    this.logger.warn(`CryptoApi error: ${res?.message || 'No response'}`);
    return {
      responsecode: '22',
      responsemessage: res?.message || 'Unable to complete request',
    };
  }

  const txs = Array.isArray(res.data?.items) ? res.data.items : [];

  if (txs.length === 0) {
    return {
      responsecode: '22',
      responsemessage: 'No transactions found for this address.',
    };
  }

  const lastConfirmed = await this.depositModel
    .findOne({ depositAddress: lowerAddr, depositType: "XRP", status: 'confirmed' })
    .sort({ confirmedAt: -1 });

  const lastHash = lastConfirmed?.txHash;
  const newDeposits: Record<string, any>[] = [];
  let foundLastHash = !lastHash; // If no last hash, allow all

  const xrpRate = await this.cryptoRate.getXrpUsdRate();
  let txIndex = 0;

  for (const tx of txs) {
    txIndex++;
    const destinationTag = tx.destinationTag?? null;
    const recipient = tx.recipient?.toLowerCase();
    const sender = tx.sender?.toLowerCase();
    const txHash = tx.hash;

    if (!recipient || recipient !== lowerAddr) continue;
    if (recipient === sender) continue;

    if (lastHash && txHash === lastHash) {
      foundLastHash = true;
      continue;
    }

    if (!foundLastHash) continue;

    const xrpAmount = parseFloat(tx.receive.amount) / 1e6;
    const usdAmount = xrpAmount * (xrpRate ?? 0);
    const confirmations = parseInt(tx.confirmations || '1', 10);

    const payload = {
      method: 'XRP',
      hash: txHash,
      depositAddress: lowerAddr,
      ccyAmount: xrpAmount,
      amountUsd: usdAmount,
      ccyValue: xrpRate ?? 0,
      confirmations,
      receiveFromAddress: sender,
      txIndex,
      txDate: tx.timestamp,
      transactionIndex: tx.positionInBlock,
      addressId,
      addressIndex,
      destinationTag,
    };

    const result = await this.confirmService.confirmDeposit(payload);
    this.logger.log(`Processed XRP #${txIndex} → ${recipient}: ${txHash} (${result.responsemessage})`);
    newDeposits.push(result);
  }

  return {
    responsecode: '00',
    responsemessage: `${newDeposits.length} XRP transactions processed.`,
    data: newDeposits,
  };
}

}
