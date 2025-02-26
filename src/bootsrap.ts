import helmet from 'helmet';
import * as compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { setupSwaggerDocuments } from './common/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import config from './config';

/**
 * Helper to be used here & in tests.
 * @param app
 */
export const configureApp = (app: any) => {
  app.use((req, res, next) => {
    next();
  });
  if (config.cors) {
    app.enableCors(config.cors);
  }
  app.use(helmet());
  // app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
};

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static files

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(config.port);
}
