import { IsNumber, IsOptional, IsString, Max, MaxLength, MinLength } from 'class-validator';
import { IsDay, IsTextBetween } from '../decorators/validators.js';

const QUANTITY_MESSAGE = 'Informe a quantidade.';
const NOTES_MESSAGE = 'Use no máximo 1000 caracteres.';
export const DATE_MESSAGE = 'Escolha uma data a partir de hoje.';
export const CANCEL_MESSAGE = 'Informe o motivo do cancelamento.';

export class CreateRequestDto {
  @IsString({ message: 'Selecione um serviço.' })
  @MinLength(1, { message: 'Selecione um serviço.' })
  serviceId: string;

  @IsString({ message: 'Selecione uma propriedade.' })
  @MinLength(1, { message: 'Selecione uma propriedade.' })
  propertyId: string;

  @IsDay({ message: DATE_MESSAGE })
  scheduledDate: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: QUANTITY_MESSAGE })
  @Max(100_000, { message: QUANTITY_MESSAGE })
  quantity: number;

  @IsOptional()
  @IsString({ message: NOTES_MESSAGE })
  @MaxLength(1000, { message: NOTES_MESSAGE })
  notes?: string;
}

export class CancelRequestDto {
  @IsOptional()
  @IsTextBetween(5, 500, { message: CANCEL_MESSAGE })
  reason?: string;
}
