import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE } from './register.dto.js';
import { BRAZILIAN_STATES, CATEGORY_ICONS } from '../types/index.js';
import type { CategoryIcon } from '../types/index.js';
import { IsTextBetween } from '../decorators/validators.js';

export class ReasonDto {
  @IsTextBetween(5, 500, { message: 'Informe o motivo com pelo menos 5 caracteres.' })
  reason: string;
}

export class CreateAdminDto {
  @IsTextBetween(2, 120, { message: 'Informe seu nome.' })
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  password: string;

  @IsTextBetween(2, 80, { message: 'Informe sua cidade.' })
  city: string;

  @IsIn(BRAZILIAN_STATES, { message: 'Selecione a UF.' })
  state: string;
}

const SLUG_MESSAGE = 'Use apenas letras minúsculas, números e hífen.';

export class CreateCategoryDto {
  @IsTextBetween(2, 40, { message: 'Informe o nome.' })
  name: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: SLUG_MESSAGE })
  slug?: string;

  @IsIn(CATEGORY_ICONS, { message: 'Selecione um ícone.' })
  icon: CategoryIcon;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsTextBetween(2, 40, { message: 'Informe o nome.' })
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: SLUG_MESSAGE })
  slug?: string;

  @IsOptional()
  @IsIn(CATEGORY_ICONS, { message: 'Selecione um ícone.' })
  icon?: CategoryIcon;

  @IsOptional()
  @IsBoolean({ message: 'Informe se a categoria está ativa.' })
  active?: boolean;
}
