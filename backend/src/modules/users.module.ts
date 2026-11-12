import { Module } from '@nestjs/common';
import { MeController } from '../controllers/me.controller.js';
import { UsersService } from '../services/users.service.js';

@Module({
  controllers: [MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
