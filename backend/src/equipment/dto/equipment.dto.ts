import { PartialType } from '@nestjs/mapped-types';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EQUIPMENT_TYPES } from '../../common/types.js';
import type { EquipmentType } from '../../common/types.js';
import { IsTextBetween } from '../../common/validators.js';

export const YEAR_MESSAGE = 'Informe um ano válido.';
const SPECS_MESSAGE = 'Use no máximo 500 caracteres.';
const PHOTOS_MESSAGE = 'Use no máximo 6 fotos.';

export class CreateEquipmentDto {
  @IsIn(EQUIPMENT_TYPES, { message: 'Selecione o tipo.' })
  type: EquipmentType;

  @IsTextBetween(2, 80, { message: 'Informe marca e modelo.' })
  model: string;

  @IsInt({ message: YEAR_MESSAGE })
  @Min(1950, { message: YEAR_MESSAGE })
  year: number;

  @IsOptional()
  @IsString({ message: SPECS_MESSAGE })
  @MaxLength(500, { message: SPECS_MESSAGE })
  specs?: string;

  @IsOptional()
  @IsArray({ message: PHOTOS_MESSAGE })
  @ArrayMaxSize(6, { message: PHOTOS_MESSAGE })
  @IsString({ each: true, message: PHOTOS_MESSAGE })
  photos?: string[];
}

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}
