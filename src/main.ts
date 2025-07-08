import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe,BadRequestException } from '@nestjs/common';
import { Responses } from './common/constants/responses';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://localhost:3002',
  ];
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => {
      const messages = errors
        .map(error => Object.values(error.constraints || {}))
        .flat();

      return new BadRequestException({
        responsecode: Responses.INVALID_REQUEST_BODY.responsecode,
        responsemessage: Responses.INVALID_REQUEST_BODY.responsemessage,
        details: messages,
      });
    },
  }));
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
