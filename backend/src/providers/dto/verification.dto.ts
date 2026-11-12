import { IsString, MinLength } from 'class-validator';

const IDENTITY_MESSAGE = 'Envie o documento de identidade.';
const ADDRESS_MESSAGE = 'Envie o comprovante de endereço.';

export class SubmitVerificationDto {
  @IsString({ message: IDENTITY_MESSAGE })
  @MinLength(1, { message: IDENTITY_MESSAGE })
  identityUploadId: string;

  @IsString({ message: ADDRESS_MESSAGE })
  @MinLength(1, { message: ADDRESS_MESSAGE })
  addressUploadId: string;
}
