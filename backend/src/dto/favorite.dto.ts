import { IsString, MinLength } from 'class-validator';

export class AddFavoriteDto {
  @IsString({ message: 'Selecione um serviço.' })
  @MinLength(1, { message: 'Selecione um serviço.' })
  serviceId: string;
}
