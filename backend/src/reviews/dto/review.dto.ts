import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsTextBetween } from '../../common/validators.js';

const RATING_MESSAGE = 'Escolha uma nota de 1 a 5.';
const COMMENT_MESSAGE = 'Use no máximo 1000 caracteres.';

export class CreateReviewDto {
  @IsInt({ message: RATING_MESSAGE })
  @Min(1, { message: RATING_MESSAGE })
  @Max(5, { message: RATING_MESSAGE })
  rating: number;

  @IsOptional()
  @IsString({ message: COMMENT_MESSAGE })
  @MaxLength(1000, { message: COMMENT_MESSAGE })
  comment?: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

export class ReplyReviewDto {
  @IsTextBetween(2, 1000, { message: 'Escreva uma resposta de 2 a 1000 caracteres.' })
  text: string;
}
