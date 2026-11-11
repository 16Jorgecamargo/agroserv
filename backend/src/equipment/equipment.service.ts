import { Injectable } from '@nestjs/common';
import { notFound, validationError } from '../common/app.exception.js';
import { ClockService } from '../common/clock.service.js';
import { defined } from '../common/objects.js';
import { UploadRulesService } from '../uploads/upload-rules.service.js';
import { YEAR_MESSAGE } from './dto/equipment.dto.js';
import type { CreateEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto.js';
import type { Equipment } from './entities/equipment.entity.js';
import { EquipmentView, toEquipmentView } from './equipment.presenter.js';
import { EquipmentRepository } from './equipment.repository.js';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly equipment: EquipmentRepository,
    private readonly uploadRules: UploadRulesService,
    private readonly clock: ClockService,
  ) {}

  async list(providerId: string): Promise<EquipmentView[]> {
    // Equipamentos do prestador autenticado
    const equipment = await this.equipment.findByProvider(providerId);
    return equipment.map(toEquipmentView);
  }

  async create(providerId: string, dto: CreateEquipmentDto): Promise<EquipmentView> {
    // Confere o ano e as fotos antes de gravar
    await this.check(providerId, dto);
    const equipment = await this.equipment.create({
      providerId,
      type: dto.type,
      model: dto.model,
      year: dto.year,
      specs: dto.specs ?? '',
      photos: dto.photos ?? [],
      createdAt: this.clock.nowIso(),
    });
    return toEquipmentView(equipment);
  }

  async update(providerId: string, id: string, dto: UpdateEquipmentDto): Promise<EquipmentView> {
    // Só o dono edita o equipamento
    const equipment = await this.loadOwn(providerId, id);
    await this.check(providerId, dto);
    return toEquipmentView(await this.equipment.update(equipment.id, defined(dto)));
  }

  async remove(providerId: string, id: string): Promise<void> {
    // Apagar o equipamento também tira o vínculo com os serviços
    const equipment = await this.loadOwn(providerId, id);
    await this.equipment.remove(equipment.id);
  }

  private async check(providerId: string, dto: UpdateEquipmentDto): Promise<void> {
    // O ano vai de 1950 até o próximo ano
    const nextYear = Number(this.clock.today().slice(0, 4)) + 1;
    if (dto.year !== undefined && dto.year > nextYear) throw validationError({ year: YEAR_MESSAGE });
    if (dto.photos?.length) await this.uploadRules.assertOwnPublicUrls(providerId, dto.photos, 'photos');
  }

  private async loadOwn(providerId: string, id: string): Promise<Equipment> {
    // Equipamento de outro prestador responde 404
    const equipment = await this.equipment.findOwn(id, providerId);
    if (!equipment) throw notFound('equipment_not_found', 'Equipamento não encontrado.');
    return equipment;
  }
}
