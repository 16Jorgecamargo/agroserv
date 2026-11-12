import { Module } from '@nestjs/common';
import { PropertiesController } from '../controllers/properties.controller.js';
import { PropertiesService } from '../services/properties.service.js';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
