import { IsOptional, IsString, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE } from './register.dto.js';

export const INVALID_LINK_MESSAGE = 'Link inválido ou expirado.';

export class ForgotPasswordDto {
  @IsOptional()
  email?: unknown;
}

export class ResetPasswordDto {
  @IsString({ message: INVALID_LINK_MESSAGE })
  @MinLength(1, { message: INVALID_LINK_MESSAGE })
  token: string;

  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  password: string;
}
