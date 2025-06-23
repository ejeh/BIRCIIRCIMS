import helmet from 'helmet';
import * as compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { setupSwaggerDocuments } from './common/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import config from './config';
import * as bodyParser from 'body-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

/**
 * Helper to be used here & in tests.
 * @param app
 */
export const configureApp = (app: any) => {
  app.use(
    bodyParser.json({
      verify: (req, res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );

  app.use((req, res, next) => {
    next();
  });
  if (config.cors) {
    app.enableCors(config.cors);
  }

  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(helmet());
  // app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static files from the uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'self'", 'http://localhost:5501'], // Add your frontend origin here
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
          ], // allow PDF.js
          connectSrc: ["'self'", 'http://localhost:5000'],
        },
      },
    }),
  );
};

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static files
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(config.port);
}
