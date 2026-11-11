import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { REPORT_ACTIONS, REPORT_REASONS, REPORT_TARGET_TYPES } from '../../common/types.js';
import type { ReportReason, ReportResolutionAction, ReportTargetType } from '../../common/types.js';
import { IsTextBetween } from '../../common/validators.js';

export const NOT_ALLOWED_MESSAGE = 'Você não pode denunciar este item.';
export const ACTION_MESSAGE = 'Ação não permitida para esta denúncia.';
export const USER_MESSAGE = 'Escreva a mensagem para o usuário.';

export class CreateReportDto {
  @IsIn(REPORT_TARGET_TYPES, { message: NOT_ALLOWED_MESSAGE })
  targetType: ReportTargetType;

  @IsString({ message: NOT_ALLOWED_MESSAGE })
  @MinLength(1, { message: NOT_ALLOWED_MESSAGE })
  targetId: string;

  @IsIn(REPORT_REASONS, { message: 'Selecione o motivo.' })
  reason: ReportReason;

  @IsTextBetween(10, 1000, { message: 'Descreva o problema com pelo menos 10 caracteres.' })
  description: string;
}

export class ResolveReportDto {
  @IsIn(REPORT_ACTIONS, { message: ACTION_MESSAGE })
  action: ReportResolutionAction;

  @IsOptional()
  @IsString({ message: 'Escolha o produtor ou o prestador da solicitação.' })
  targetUserId?: string;

  @IsOptional()
  @IsTextBetween(5, 500, { message: USER_MESSAGE })
  message?: string;

  @IsTextBetween(5, 1000, { message: 'Escreva a nota interna com pelo menos 5 caracteres.' })
  internalNote: string;
}
