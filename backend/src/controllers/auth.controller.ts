import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, Public } from '../decorators/auth.decorators.js';
import type { User } from '../entities/user.entity.js';
import type { UserView } from '../presenters/user.presenter.js';
import { AuthService, SessionView } from '../services/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-recovery.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { ForgotPasswordView, PasswordRecoveryService } from '../services/password-recovery.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly recovery: PasswordRecoveryService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<SessionView> {
    // Cadastro de produtor ou prestador
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<SessionView> {
    // Login de qualquer papel
    return this.auth.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: User): UserView {
    // Conta da sessão atual
    return this.auth.me(user);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordView> {
    // Pede o link de redefinição de senha
    return this.recovery.forgot(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    // Define a nova senha a partir do link recebido
    return this.recovery.reset(dto);
  }
}
