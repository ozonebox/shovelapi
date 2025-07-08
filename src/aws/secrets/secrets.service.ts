import { Injectable } from '@nestjs/common';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService {
  private client = new SecretsManagerClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async getMnemonic(secretName: string) {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });
  try{
    const response = await this.client.send(command);
       return JSON.parse(response.SecretString!);
  }catch{
    return null;
  }
    
  }

  async saveMnemonic(secretName: string, secretValue: any): Promise<void> {
    try {
      const createCommand = new CreateSecretCommand({
        Name: secretName,
       SecretString: JSON.stringify(secretValue),
      });

      await this.client.send(createCommand);
      console.log(` Secret '${secretName}' created.`);
    } catch (err: any) {
      if (err.name === 'ResourceExistsException') {
        const updateCommand = new PutSecretValueCommand({
          SecretId: secretName,
          SecretString: secretValue.mnemonic,
        });

        await this.client.send(updateCommand);
        console.log(` Secret '${secretName}' updated.`);
      } else {
        throw err;
      }
    }
  }
}
