import type { Property } from '../entities/property.entity.js';

export interface PropertyView {
  id: string;
  name: string;
  city: string;
  state: string;
  accessNotes: string;
  areaHectares: number;
  crops: string[];
  createdAt: string;
}

export function toPropertyView(property: Property): PropertyView {
  // Converte a entidade no tipo Property do contrato
  const { id, name, city, state, accessNotes, areaHectares, crops, createdAt } = property;
  return { id, name, city, state, accessNotes, areaHectares, crops, createdAt };
}
