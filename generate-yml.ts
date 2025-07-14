import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

const entries = lines
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .map((line) => {
    const [key] = line.split('=');
    return `${key}: \${env:${key}}`;
  })
  .sort();

console.log('environment:\n' + entries.map((e) => '  ' + e).join('\n'));
