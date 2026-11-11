import { Injectable } from '@nestjs/common';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BRASILIA_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isValidDay(value: unknown): value is string {
  // Confere o formato YYYY-MM-DD e se o dia existe no calendário
  if (typeof value !== 'string' || !DAY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function addDays(day: string, amount: number): string {
  // Soma dias a uma data YYYY-MM-DD sem depender de fuso
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class ClockService {
  now(): Date {
    // Momento atual, isolado para ser trocado nos testes
    return new Date();
  }

  nowIso(): string {
    // Momento atual em ISO 8601 UTC
    return this.now().toISOString();
  }

  today(): string {
    // "Hoje" no horário de Brasília, em YYYY-MM-DD
    return BRASILIA_DAY.format(this.now());
  }

  isoFromNow(milliseconds: number): string {
    // Momento deslocado a partir de agora, em ISO 8601 UTC
    return new Date(this.now().getTime() + milliseconds).toISOString();
  }
}
