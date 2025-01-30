import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import config from 'src/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './localstrategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {},
    }),
    PassportModule,
  ],
  controllers: [AuthController],

  providers: [AuthService, JwtAuthGuard, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
