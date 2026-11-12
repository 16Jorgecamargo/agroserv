export function defined<T extends object>(value: T): Partial<T> {
  // Remove as chaves sem valor para não gravar campos não enviados
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}
