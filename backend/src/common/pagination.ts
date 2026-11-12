export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PageRequest {
  page: number;
  pageSize: number;
  skip: number;
}

function positiveInteger(value: unknown): number | null {
  // Aceita só inteiros maiores ou iguais a 1
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function parsePage(
  query: Record<string, unknown>,
  defaultSize: number,
  maxSize: number,
): PageRequest {
  // Valores inválidos de página usam o padrão, sem erro
  const page = positiveInteger(query.page) ?? 1;
  const requested = positiveInteger(query.pageSize) ?? defaultSize;
  const pageSize = Math.min(requested, maxSize);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginate<T>(
  data: T[],
  total: number,
  request: PageRequest,
): Paginated<T> {
  // Monta a resposta paginada do contrato
  const totalPages = Math.max(1, Math.ceil(total / request.pageSize));
  const meta = { page: request.page, pageSize: request.pageSize, total, totalPages };
  return { data, meta };
}

export function paginateArray<T>(items: T[], request: PageRequest): Paginated<T> {
  // Pagina uma lista já carregada em memória
  const data = items.slice(request.skip, request.skip + request.pageSize);
  return paginate(data, items.length, request);
}
