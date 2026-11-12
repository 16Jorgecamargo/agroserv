import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MailService } from '../mail/mail.service.js';
import { PasswordRecoveryService } from './password-recovery.service.js';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Segredo e validade do token vêm do ambiente
        secret: config.getOrThrow<string>('jwtSecret'),
        signOptions: { expiresIn: config.getOrThrow<string>('jwtExpiresIn') as never },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordRecoveryService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
