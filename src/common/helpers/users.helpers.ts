// src/common/helpers/user.helpers.ts
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function isOver18(date: string): boolean {
  const dob = new Date(date);
  const age = new Date().getFullYear() - dob.getFullYear();
  return age >= 18;
}

export function hashPassword(password: string, config: ConfigService): string {
  const salt = config.get<string>('PW_SALT') || 'STATIC_SALT';
  return crypto
    .createHash('md5')
    .update(`${password}_${password}${password}${password}${salt}`)
    .digest('hex');
}

export function generateUname(base: string): string {
  return base.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000);
}

export function generateKey(): string {
  return  crypto.createHash('md5').update(Math.random().toString()).digest('hex');

}


export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // e.g., "4721"
}


export function hashOtp(otp: string): string {
  return crypto.createHash('md5').update(otp).digest('hex');
}


export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const clone = { ...obj };
  keys.forEach((key) => {
    delete clone[key];
  });
  return clone;
}


