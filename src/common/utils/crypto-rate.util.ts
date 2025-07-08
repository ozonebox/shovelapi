// src/common/utils/crypto-rate.util.ts
import { Injectable, Logger,Inject } from '@nestjs/common';
import { HttpRequestUtil } from './http-request.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';

@Injectable()
export class CryptoRateUtil {
  private readonly logger = new Logger(CryptoRateUtil.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache,private readonly http: HttpRequestUtil) {}

  // async getBtcUsdRate(): Promise<number | null> {
  //   const url = 'https://blockchain.info/tobtc?currency=USD&value=1';
  //   const oneUsd = await this.http.get<string>(url);

  //   if (oneUsd && !isNaN(Number(oneUsd))) {
  //     const oneBtc = 1 / parseFloat(oneUsd);
  //     return oneBtc;
  //   }

  //   return null;
  // }

  async getBtcUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('btc_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://blockchain.info/tobtc?currency=USD&value=1',
      );
      const price = parseFloat(res.data);
      if (!isNaN(price)) {
        const oneBtc = 1 / price;
        await this.cacheManager.set('btc_usd_price', oneBtc, 900); // 5 min TTL
        return oneBtc;
      }
      return null;
    } catch (error) {
      console.error('Error fetching BTC price:', error.message);
      return null;
    }
  }
  async getEthUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('eth_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('eth_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ETH price:', error.message);
      return null;
    }
  }

  // async getEthUsdRate(): Promise<number | null> {
  //   const url = ' https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
  //   const res = await this.http.get<{ ethereum: any }>(url);
  //   return res?.ethereum?.usd ?? null;
  // }

  // async getEthUsdRate(): Promise<number | null> {
  //   const url = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD';
  //   const res = await this.http.get<{ USD: number }>(url);
  //   return res?.USD ?? null;
  // }

  async getLtcUsdRate(): Promise<number | null> {
    const url = 'https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD';
    const res = await this.http.get<{ USD: number }>(url);
    return res?.USD ?? null;
  }

  async getUsdtUsdRate(): Promise<number | null> {
    const url = 'https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=USD';
    const res = await this.http.get<{ USD: number }>(url);
    return res?.USD ?? null;
  }
}
