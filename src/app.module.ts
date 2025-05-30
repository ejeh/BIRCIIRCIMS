import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MorganModule } from 'nest-morgan';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
// import config, { dbUrl } from './config';
import { PassportModule } from '@nestjs/passport';
import { MailerModule, HandlebarsAdapter } from '@nest-modules/mailer';
import { ServeStaticMiddleware } from '@nest-middlewares/serve-static';
import * as path from 'path';
import { LoggerMiddleware } from './common/middleware/logger';
import { AuthModule } from './auth/auth.module';
import { IndigeneCertificateModule } from './indigene-certificate/indigene-certificate.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { IdcardModule } from './idcard/idcard.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TransactionModule } from './transaction/transaction.module';
import { KindredModule } from './kindred/kindred.module';

import config, { dbUrl } from './config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HelmetMiddleware } from '@nest-middlewares/helmet';
import mongoose from 'mongoose';

console.log(config.isProd); // boolean
console.log(dbUrl); // string | undefined
const DEV_TRANSPORTER = {
  host: 'smtp-relay.sendinblue.com',
  port: 587,
  auth: {
    user: 'developercircus@gmail.com',
    pass: 'CR2bIMjv3XZkrTEL',
  },
};

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    UsersModule,
    MorganModule,
    MongooseModule.forRoot(dbUrl, {
    serverSelectionTimeoutMS: 15000,  // Increased timeout
    socketTimeoutMS: 30000,
    retryWrites: true,
    retryReads: true,
    // For Galaxy's network:
    connectTimeoutMS: 20000,
    family: 4,  // Force IPv4
    // TLS/SSL options:
    // tls: true,
    tlsAllowInvalidCertificates: false  // Set true only for testing
}),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Path to your static files directory
      serveRoot: '/uploads', // The base URL path
    }),
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    PassportModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: DEV_TRANSPORTER,
        defaults: {
          from: config.mail.from,
        },
        template: {
          dir: __dirname + '/../templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: path.join(__dirname, 'templates/partials'),
            options: {
              strict: true,
            },
          },
        },
      }),
    }),
    AuthModule,
    IndigeneCertificateModule,
    IdcardModule,
    TransactionModule,
    KindredModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    HelmetMiddleware.configure({});
    consumer.apply(HelmetMiddleware).forRoutes('*');

    ServeStaticMiddleware.configure(
      path.resolve(__dirname, '..', '..', 'public'),
      config.static,
    );
    consumer.apply(ServeStaticMiddleware).forRoutes('public');

    if (!config.isTest) {
      consumer.apply(LoggerMiddleware).forRoutes('api');
    }
  }
}
