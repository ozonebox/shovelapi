// src/common/services/encryption.service.ts

import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.PAYMENT_SECRET_KEY || 'your-default-secret-key'; // ✅ store in .env

@Injectable()
export class EncryptionService {
  encrypt(data: any): string {
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const ciphertext = CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
    return ciphertext;
  }

  decrypt(encrypted: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid or corrupt encrypted data');
    }
  }
}
