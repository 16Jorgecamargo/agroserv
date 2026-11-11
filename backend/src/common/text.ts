export function normalizeText(value: string): string {
  // Tira acento, caixa e pontuação para comparar textos de busca
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchTerms(value: unknown): string[] {
  // Quebra o texto digitado em termos normalizados
  if (typeof value !== 'string') return [];
  return normalizeText(value).split(' ').filter(Boolean);
}

export function onlyDigits(value: string): string {
  // Mantém apenas os dígitos de telefone e documento
  return value.replace(/\D/g, '');
}

export function roundMoney(value: number): number {
  // Arredonda valores em reais para 2 casas
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function slugify(value: string): string {
  // Gera um slug com minúsculas, números e hífen
  return normalizeText(value).replace(/ /g, '-');
}
