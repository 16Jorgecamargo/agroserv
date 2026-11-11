import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString,
} from 'class-validator';
import { BRAZILIAN_STATES, PRICE_UNITS } from '../../common/types.js';
import type { PriceUnit } from '../../common/types.js';
import { IsTextBetween } from '../../common/validators.js';

const PRICE_MESSAGE = 'Informe o preço.';
const PHOTOS_MESSAGE = 'Use no máximo 8 fotos.';
const EQUIPMENT_MESSAGE = 'Equipamento inválido.';

export class CreateServiceDto {
  @IsTextBetween(3, 80, { message: 'Informe o título.' })
  title: string;

  @IsString({ message: 'Selecione uma categoria.' })
  categoryId: string;

  @IsTextBetween(20, 2000, { message: 'Descreva o serviço com pelo menos 20 caracteres.' })
  description: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: PRICE_MESSAGE })
  @IsPositive({ message: PRICE_MESSAGE })
  price: number;

  @IsIn(PRICE_UNITS, { message: 'Selecione a unidade.' })
  priceUnit: PriceUnit;

  @IsTextBetween(2, 80, { message: 'Informe sua cidade.' })
  city: string;

  @IsIn(BRAZILIAN_STATES, { message: 'Selecione a UF.' })
  state: string;

  @IsOptional()
  @IsArray({ message: PHOTOS_MESSAGE })
  @ArrayMaxSize(8, { message: PHOTOS_MESSAGE })
  @IsString({ each: true, message: PHOTOS_MESSAGE })
  photos?: string[];

  @IsOptional()
  @IsArray({ message: EQUIPMENT_MESSAGE })
  @IsString({ each: true, message: EQUIPMENT_MESSAGE })
  equipmentIds?: string[];

  @IsOptional()
  @IsBoolean({ message: 'Informe se o serviço está disponível.' })
  available?: boolean;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
