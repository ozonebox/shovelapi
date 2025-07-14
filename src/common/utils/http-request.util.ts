
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestHeaders } from 'axios';

@Injectable()
export class HttpRequestUtil {
  private readonly logger = new Logger(HttpRequestUtil.name);
  private readonly CRYPTOAPI_API_KEY = process.env.CRYPTOAPI_API_KEY!;
  async get<T = any>(url: string, headers?: AxiosRequestHeaders): Promise<T | null> {
    try {
      const response = await axios.get<T>(url, {
        headers: headers || {
          'Content-Type': 'application/json',
          'User-Agent': 'NestJS-App',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`GET ${url} failed: ${error.message}`);
      return null;
    }
  }

  async getCryptoApi<T = any>(url: string,): Promise<T | null> {
    try {
      const response = await axios.get<T>(url, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NestJS-App',
          'X-API-Key': this.CRYPTOAPI_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`GET ${url} failed: ${error.message}`);
      return null;
    }
  }

  async post<T = any>(url: string, data: any, headers?: AxiosRequestHeaders): Promise<T | null> {
    try {
      const response = await axios.post<T>(url, data, {
        headers: headers || {
          'Content-Type': 'application/json',
          'User-Agent': 'NestJS-App',
          
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`POST ${url} failed: ${error.message}`);
      return null;
    }
  }

   async postCryptoApi<T = any>(url: string, data: any): Promise<T | null> {
      try {
        const response = await axios.post<T>(url, data, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NestJS-App',
            'X-API-Key': this.CRYPTOAPI_API_KEY,
          },
        });

        return response.data;
      } catch (error) {
        this.logger.error(`POST ${url} failed: ${error.message}`);
        return null;
      } finally {
        //  Delay next action by 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

}
