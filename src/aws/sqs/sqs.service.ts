// src/aws/sqs/sqs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageCommandOutput,
  ReceiveMessageCommandOutput,
} from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);

  private client = new SQSClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async sendToQueue(
    queueUrl: string,
    payload: Record<string, any>,
  ): Promise<SendMessageCommandOutput | null> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    });

    try {
      const response = await this.client.send(command);
      this.logger.log(`Sent message to SQS: ${response.MessageId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      return null;
    }
  }

  async receiveMessages(queueUrl: string, maxMessages = 5): Promise<ReceiveMessageCommandOutput | null> {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 10,
    });

    try {
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      this.logger.error(`Failed to receive messages: ${error.message}`);
      return null;
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    try {
      await this.client.send(command);
      this.logger.log(`Deleted message from SQS`);
    } catch (error) {
      this.logger.error(`Failed to delete message: ${error.message}`);
    }
  }
}
