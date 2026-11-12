import { Equals, IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { BRAZILIAN_STATES } from '../../common/types.js';
import { IsPhone, IsTextBetween } from '../../common/validators.js';

export const PASSWORD_MESSAGE = 'A senha precisa ter pelo menos 8 caracteres.';

export class RegisterDto {
  @IsTextBetween(2, 120, { message: 'Informe seu nome.' })
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString({ message: PASSWORD_MESSAGE })
  @MinLength(8, { message: PASSWORD_MESSAGE })
  password: string;

  @IsPhone({ message: 'Informe um telefone válido.' })
  phone: string;

  @IsTextBetween(2, 80, { message: 'Informe sua cidade.' })
  city: string;

  @IsIn(BRAZILIAN_STATES, { message: 'Selecione a UF.' })
  state: string;

  @IsIn(['producer', 'provider'], { message: 'Escolha como você vai usar o AgroServ.' })
  role: 'producer' | 'provider';

  @Equals(true, { message: 'Aceite os termos de uso e a política de privacidade.' })
  acceptedTerms: boolean;
}
