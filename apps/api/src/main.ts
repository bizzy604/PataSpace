import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './common/bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const { globalPrefix } = configureApp(app);

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  Logger.log(`PataSpace API listening on http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();
