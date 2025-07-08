import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { Response } from 'express';

@Injectable()
export class QrCodeService {
  // Generate a QR code as a Data URL (Base64)
  async generateQrCodeDataUrl(data: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data);
      return qrCode; // Base64 string, usable in <img src="..." />
    } catch (error) {
      throw new Error(`QR Code generation failed: ${error.message}`);
    }
  }

  async streamQrCodePng(data: string, res: Response) {
    try {
      res.setHeader('Content-Type', 'image/png');
      QRCode.toFileStream(res, data, {
        type: 'png',
        width: 300,
        errorCorrectionLevel: 'H',
      });
    } catch (error) {
      res.status(500).send('QR code generation failed.');
    }
  }

  // Optionally, generate a QR code and save it to a file
  async generateQrCodeToFile(data: string, filepath: string): Promise<void> {
    try {
      await QRCode.toFile(filepath, data);
    } catch (error) {
      throw new Error(`QR Code file generation failed: ${error.message}`);
    }
  }
}
