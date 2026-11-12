import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { IsDay, IsTextBetween } from '../../common/validators.js';
import { DATE_MESSAGE } from './producer-request.dto.js';

const VALUE_MESSAGE = 'Informe um valor válido.';

export class RejectRequestDto {
  @IsTextBetween(5, 500, { message: 'Informe o motivo da recusa.' })
  reason: string;
}

export class ProviderCancelDto {
  @IsTextBetween(5, 500, { message: 'Informe o motivo do cancelamento.' })
  reason: string;
}

export class CounterOfferDto {
  @IsOptional()
  @IsDay({ message: DATE_MESSAGE })
  date?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 }, { message: VALUE_MESSAGE })
  @IsPositive({ message: VALUE_MESSAGE })
  value?: number;

  @IsTextBetween(5, 500, { message: 'Explique a proposta ao produtor.' })
  message: string;
}
