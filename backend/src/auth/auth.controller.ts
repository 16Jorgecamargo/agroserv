import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, Public } from '../common/auth.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import type { UserView } from '../users/user.presenter.js';
import { AuthService, SessionView } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
}
