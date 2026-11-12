import { Module } from '@nestjs/common';
import { EquipmentController } from '../controllers/equipment.controller.js';
import { EquipmentService } from '../services/equipment.service.js';

@Module({
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
