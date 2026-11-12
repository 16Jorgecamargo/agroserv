import { Module } from '@nestjs/common';
import { UploadsController } from '../controllers/uploads.controller.js';
import { UploadsService } from '../services/uploads.service.js';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
