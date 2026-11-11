import { IsTextBetween } from '../../common/validators.js';

export class CreateMessageDto {
  @IsTextBetween(1, 2000, { message: 'Escreva uma mensagem de até 2000 caracteres.' })
  text: string;
}
