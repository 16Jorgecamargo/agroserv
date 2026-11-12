import { IsDay } from '../decorators/validators.js';

export class BlockDayDto {
  @IsDay({ message: 'Escolha uma data a partir de hoje.' })
  date: string;
}
