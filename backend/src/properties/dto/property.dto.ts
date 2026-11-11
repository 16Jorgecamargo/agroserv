import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, MinLength,
} from 'class-validator';
import { normalizeText } from '../../common/text.js';
import { BRAZILIAN_STATES } from '../../common/types.js';
import { IsTextBetween } from '../../common/validators.js';

const AREA_MESSAGE = 'Informe a área em hectares.';
const CROPS_MESSAGE = 'Informe até 10 culturas.';
const NOTES_MESSAGE = 'Use no máximo 500 caracteres.';

export class CreatePropertyDto {
  @IsTextBetween(2, 80, { message: 'Informe o nome da propriedade.' })
  name: string;

  @IsTextBetween(2, 80, { message: 'Informe a cidade.' })
  city: string;

  @IsIn(BRAZILIAN_STATES, { message: 'Selecione a UF.' })
  state: string;

  @IsOptional()
  @IsString({ message: NOTES_MESSAGE })
  @MaxLength(500, { message: NOTES_MESSAGE })
  accessNotes?: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: AREA_MESSAGE })
  @Max(1_000_000, { message: AREA_MESSAGE })
  areaHectares: number;

  @IsOptional()
  @IsArray({ message: CROPS_MESSAGE })
  @ArrayMaxSize(10, { message: CROPS_MESSAGE })
  @ArrayUnique((crop: unknown) => (typeof crop === 'string' ? normalizeText(crop) : crop), { message: CROPS_MESSAGE })
  @IsString({ each: true, message: CROPS_MESSAGE })
  @MinLength(2, { each: true, message: CROPS_MESSAGE })
  @MaxLength(40, { each: true, message: CROPS_MESSAGE })
  crops?: string[];
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
