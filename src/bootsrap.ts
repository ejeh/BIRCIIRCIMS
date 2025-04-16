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
import { UsersService } from './users/users.service';
import * as bodyParser from 'body-parser';

// import { seedAdmin } from './seed-adin';

/**
 * Helper to be used here & in tests.
 * @param app
 */
export const configureApp = (app: any) => {
  // Before `app.listen(...)`
  // app.use('/api/transaction/webhook', express.raw({ type: '*/*' }));

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
  app.use(helmet());
  // app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // main.ts
  // app.use(
  //   express.json({
  //     verify: (req: any, res, buf) => {
  //       req.rawBody = buf; // <-- this line is essential
  //     },
  //   }),
  // );
};

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static files

  // Retrieve the UsersService from the application context
  const usersService = app.get(UsersService);
  // await seedAdmin(usersService);

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(config.port);
}
