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
import { UserRole } from 'src/users/users.role.enum';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './users/users.schema';
import mongoose from 'mongoose';

import * as crypto from 'crypto';

(global as any).crypto = crypto;

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

  // 1. Connect to MongoDB manually
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/BSCR-MIS',
  );

  // 2. Create the User model manually
  const UserModel = mongoose.model('User', UserSchema);

  const email = 'ejehgodfrey@gmail.com';
  const phone = '08069710658';
  const NIN = '12345678901';

  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('magickiss17A#', 10);

    await UserModel.create({
      email,
      firstname: 'Godfrey',
      lastname: 'Ejeh',
      phone,
      NIN,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      isActive: true,
    });

    console.log('✅ Super admin created successfully');
  } else if (existingUser.role !== UserRole.SUPER_ADMIN) {
    await UserModel.updateOne(
      { email },
      { $set: { role: UserRole.SUPER_ADMIN } },
    );
    console.log('✅ Super admin role assigned to existing user');
  } else {
    console.log('ℹ️ Super admin already exists');
  }

  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static files
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(config.port);
}
