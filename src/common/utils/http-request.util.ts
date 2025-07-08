
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestHeaders } from 'axios';

@Injectable()
export class HttpRequestUtil {
  private readonly logger = new Logger(HttpRequestUtil.name);

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
}
