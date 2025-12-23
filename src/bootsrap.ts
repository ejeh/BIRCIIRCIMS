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

import { webcrypto as crypto } from 'crypto';
import { RolePermissionSchema } from './roles/role-permission.schema';
import { getDefaultPermissions } from './roles/roles-permission.default';

if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}

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

async function seedPermissions() {
  console.log('🔑 Starting permissions seeding...');
  const RolePermissionModel = mongoose.model(
    'RolePermission',
    RolePermissionSchema,
  );
  const roles = Object.values(UserRole);

  for (const role of roles) {
    const existingRolePermission = await RolePermissionModel.findOne({ role });

    if (!existingRolePermission) {
      // Create if it doesn't exist
      await RolePermissionModel.create({
        role,
        permissions: getDefaultPermissions(role),
      });
      console.log(` Created permissions for role: ${role}`);
    } else if (existingRolePermission.permissions.length === 0) {
      // Update if it exists but is empty
      await RolePermissionModel.updateOne(
        { role },
        { $set: { permissions: getDefaultPermissions(role) } },
      );
      console.log(` Updated empty permissions for role: ${role}`);
    } else {
      console.log(` Permissions already exist for role: ${role}`);
    }
  }
  console.log('🔑 Permissions seeding completed.');
}

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Connect to MongoDB manually
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/BSCR-MIS',
  );

  // 2. Create the User model manually
  const UserModel = mongoose.model('User', UserSchema);

  const email = 'akor@gmail.com';
  const phone = '08043710667';
  const NIN = '88765432133';

  const existingUser = await UserModel.findOne({ email });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('magickiss17A#', 10);

    await UserModel.create({
      email,
      firstname: 'AKor',
      lastname: 'Ejeh',
      phone,
      NIN,
      password: hashedPassword,
      role: UserRole.GLOBAL_ADMIN,
      isVerified: true,
      isActive: true,
    });

    console.log('Global admin created successfully');
  } else if (existingUser.role !== UserRole.GLOBAL_ADMIN) {
    await UserModel.updateOne(
      { email },
      { $set: { role: UserRole.GLOBAL_ADMIN } },
    );
    console.log('Global admin role assigned to existing user');
  } else {
    console.log('Global admin already exists');
  }

  // 3. Seed permissions after user creation
  await seedPermissions();

  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static files
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  configureApp(app);

  setupSwaggerDocuments(app);

  await app.listen(config.port);
}
