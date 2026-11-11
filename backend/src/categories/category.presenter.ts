import type { CategoryIcon } from '../common/types.js';
import type { Category } from './entities/category.entity.js';

export interface CategoryView {
  id: string;
  slug: string;
  name: string;
  icon: CategoryIcon;
  active: boolean;
}

export function toCategoryView(category: Category): CategoryView {
  // Converte a entidade no tipo Category do contrato
  const { id, slug, name, icon, active } = category;
  return { id, slug, name, icon, active };
}
