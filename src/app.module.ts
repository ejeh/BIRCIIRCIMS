import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MorganModule } from 'nest-morgan';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ServeStaticMiddleware } from '@nest-middlewares/serve-static';
import * as path from 'path';
import { LoggerMiddleware } from './common/middleware/logger';
import { AuthModule } from './auth/auth.module';
import { IndigeneCertificateModule } from './indigene-certificate/indigene-certificate.module';
import { IdcardModule } from './idcard/idcard.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TransactionModule } from './transaction/transaction.module';
import { KindredModule } from './kindred/kindred.module';

import config, { dbUrl } from './config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HelmetMiddleware } from '@nest-middlewares/helmet';
import { NotificationsModule } from './notifications/notifications.module';
import { SmsModule } from './sms/sms.module';
import { TasksModule } from './task/tasks.module';
import { BiometricsModule } from './biometrics/biometrics.module';
import { MailModule } from './mail/mail.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';

// console.log(config.isProd); // boolean
// console.log(dbUrl); // string | undefined
const DEV_TRANSPORTER = {
  host: 'smtp-relay.sendinblue.com',
  port: 587,
  secure: false, // true for 465, false for other ports
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
    MongooseModule.forRoot(dbUrl),

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
        debug: true, // ✅ shows detailed logs
      }),
    }),
    AuthModule,
    IndigeneCertificateModule,
    IdcardModule,
    TransactionModule,
    KindredModule,
    NotificationsModule,
    SmsModule,
    TasksModule,
    BiometricsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
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
