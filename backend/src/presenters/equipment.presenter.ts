import type { EquipmentType } from '../types/index.js';
import type { Equipment } from '../entities/equipment.entity.js';

export interface EquipmentView {
  id: string;
  providerId: string;
  type: EquipmentType;
  model: string;
  year: number;
  specs: string;
  photos: string[];
}

export function toEquipmentView(equipment: Equipment): EquipmentView {
  // Converte a entidade no tipo Equipment do contrato
  const { id, providerId, type, model, year, specs, photos } = equipment;
  return { id, providerId, type, model, year, specs, photos };
}
