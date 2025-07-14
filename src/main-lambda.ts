// src/main-lambda.ts
import { Handler, Context, Callback } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

let cachedServer;

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    await app.init();
    cachedServer = createServer(app.getHttpAdapter().getInstance());
  }
  return cachedServer;
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  const server = await bootstrapServer();
  return proxy(server, event, context, 'PROMISE').promise;
};
