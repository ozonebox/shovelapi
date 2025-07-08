import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export async function sendEmail(
  config: ConfigService,
  options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  const transporter = nodemailer.createTransport({
    host: config.get('EMAIL_HOST'),
    port: Number(config.get('EMAIL_PORT')),
    secure: true,
    auth: {
      user: config.get('EMAIL_USER'),
      pass: config.get('EMAIL_PASS'),
    },
  });

  try {
    await transporter.sendMail({
      from: config.get('EMAIL_FROM'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
