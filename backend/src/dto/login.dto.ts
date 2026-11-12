import { IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  email?: unknown;

  @IsOptional()
  password?: unknown;
}
