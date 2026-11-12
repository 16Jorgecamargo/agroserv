import { IsString, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE } from '../../auth/dto/register.dto.js';

export class ChangePasswordDto {
  @IsString({ message: 'Senha atual incorreta.' })
  currentPassword: string;

  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
