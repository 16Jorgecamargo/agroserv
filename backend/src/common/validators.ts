import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidDay } from './clock.service.js';
import { onlyDigits } from './text.js';

function custom(
  name: string,
  check: (value: unknown) => boolean,
  options?: ValidationOptions,
): PropertyDecorator {
  // Registra uma regra própria reaproveitando o class-validator
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name,
      target: target.constructor,
      propertyName: String(propertyName),
      options,
      validator: { validate: check },
    });
  };
}

export function IsPhone(options?: ValidationOptions): PropertyDecorator {
  // Telefone com 10 ou 11 dígitos, ignorando a pontuação
  return custom(
    'isPhone',
    (value) => typeof value === 'string' && [10, 11].includes(onlyDigits(value).length),
    options,
  );
}

export function IsCpfOrCnpj(options?: ValidationOptions): PropertyDecorator {
  // Documento com 11 (CPF) ou 14 (CNPJ) dígitos, ignorando a pontuação
  return custom(
    'isCpfOrCnpj',
    (value) => typeof value === 'string' && [11, 14].includes(onlyDigits(value).length),
    options,
  );
}

export function IsDay(options?: ValidationOptions): PropertyDecorator {
  // Dia no formato YYYY-MM-DD existente no calendário
  return custom('isDay', (value) => isValidDay(value), options);
}

export function IsTextBetween(
  min: number,
  max: number,
  options?: ValidationOptions,
): PropertyDecorator {
  // Texto com tamanho entre o mínimo e o máximo
  return custom(
    'isTextBetween',
    (value) => typeof value === 'string' && value.length >= min && value.length <= max,
    options,
  );
}
