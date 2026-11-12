import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { BRAZILIAN_STATES } from '../types/index.js';
import { IsPhone, IsTextBetween } from '../decorators/validators.js';

export class UpdateMeDto {
  @IsOptional()
  @IsTextBetween(2, 120, { message: 'Informe seu nome.' })
  name?: string;

  @IsOptional()
  @IsPhone({ message: 'Informe um telefone válido.' })
  phone?: string;

  @IsOptional()
  @IsTextBetween(2, 80, { message: 'Informe sua cidade.' })
  city?: string;

  @IsOptional()
  @IsIn(BRAZILIAN_STATES, { message: 'Selecione a UF.' })
  state?: string;

  @ValidateIf((dto: UpdateMeDto) => dto.avatarUrl !== null && dto.avatarUrl !== undefined)
  @IsString({ message: 'Envie a foto novamente.' })
  avatarUrl?: string | null;
}
