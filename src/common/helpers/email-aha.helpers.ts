import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export async function sendEmail(
  config: ConfigService,
  options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    // Load and prepare the HTML template
    const template = config.get('EMAIL_TEMP') 

    const finalHtml = template
      .replace(/{siteurl}/g, config.get('SITE_URL') || '')
      .replace(/{subject}/g, options.subject)
      .replace(/{fname}/g, 'there')
      .replace(/{body}/g, options.html || options.text || '')
      .replace(/{to}/g, options.to)
      .replace(/{code_block}/g, "")
      .replace(/{year}/g, new Date().getFullYear());
      console.log('finalHtml',finalHtml)
    // Prepare payload for AhaSend
    const payload = {
      from: {
        name: config.get('EMAIL_FROM_NAME') || 'Shovel',
        email: config.get('EMAIL_FROM'),
      },
      recipients: [
        {
          name: 'You',
          email: options.to,
        },
      ],
      content: {
        subject: options.subject,
        html_body: finalHtml,
      },
    };

    const res = await axios.post(
      config.get('AHA_URL') as string,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.get('AHA_API_KEY'),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('AhaSend email error:', error.response?.data || error.message);
    return { success: false, error };
  }
}
