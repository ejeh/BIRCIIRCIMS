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
import { KindredService } from './kindred/kindred.service';
import { KindredModule } from './kindred/kindred.module';



import config, { dbUrl } from './config';

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
    UsersModule,
    MorganModule,
    MongooseModule.forRoot(dbUrl),
    // MongooseModule.forRoot(dbUrl, {
    //   ssl: config.isProd,
    //   retryAttempts: 5,
    //   retryDelay: 3000,
    // }),
    
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
