import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsCpfOrCnpj } from '../../common/validators.js';

const RADIUS_MESSAGE = 'Informe um raio entre 1 e 500 km.';
const YEARS_MESSAGE = 'Informe os anos de experiência.';
const DESCRIPTION_MESSAGE = 'Use no máximo 1000 caracteres.';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsCpfOrCnpj({ message: 'Informe um CPF ou CNPJ válido.' })
  document?: string;

  @IsOptional()
  @IsInt({ message: RADIUS_MESSAGE })
  @Min(1, { message: RADIUS_MESSAGE })
  @Max(500, { message: RADIUS_MESSAGE })
  serviceRadiusKm?: number;

  @IsOptional()
  @IsInt({ message: YEARS_MESSAGE })
  @Min(0, { message: YEARS_MESSAGE })
  @Max(80, { message: YEARS_MESSAGE })
  yearsOfExperience?: number;

  @IsOptional()
  @IsString({ message: DESCRIPTION_MESSAGE })
  @MaxLength(1000, { message: DESCRIPTION_MESSAGE })
  description?: string;
}
