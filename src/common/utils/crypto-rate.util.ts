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

  async getLtcUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('ltc_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('ltc_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching LTC price:', error.message);
      return null;
    }
  }

  async getSolUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('sol_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('sol_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching SOL price:', error.message);
      return null;
    }
  }

  async getBchUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('bch_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=BCH&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('bch_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching BCH price:', error.message);
      return null;
    }
  }

  async getUsdtUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('usdt_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('usdt_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching USDT price:', error.message);
      return null;
    }
  }

  async getXrpUsdRate(): Promise<number | null> {
    const cached = await this.cacheManager.get<number>('xrp_usd_price');
    if (cached) return cached;

    try {
      const res = await axios.get(
        'https://min-api.cryptocompare.com/data/price?fsym=XRP&tsyms=USD',
      );
      const price = parseFloat(res.data.USD);
      if (!isNaN(price)) {
        await this.cacheManager.set('xrp_usd_price', price, 900); // 5 min TTL
        return price;
      }
      return null;
    } catch (error) {
      console.error('Error fetching XRP price:', error.message);
      return null;
    }
  }


  
}
