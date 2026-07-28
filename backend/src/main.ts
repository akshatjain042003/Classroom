import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('api');

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://13.204.29.116:3000',
      'http://13.204.29.116',
      'https://13.204.29.116.sslip.io',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(process.env.PORT);
}
bootstrap();
