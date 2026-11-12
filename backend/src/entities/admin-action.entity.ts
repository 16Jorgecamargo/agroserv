import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { AdminActionType, AdminTargetType } from '../types/index.js';
import { User } from './user.entity.js';

@Entity('admin_actions')
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  adminId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  admin?: Relation<User>;

  @Column('text')
  adminName: string;

  @Column('text')
  action: AdminActionType;

  @Column('text')
  targetType: AdminTargetType;

  @Index()
  @Column('text')
  targetId: string;

  @Column('text')
  targetLabel: string;

  @Column('text', { nullable: true })
  reason: string | null;

  @Index()
  @Column('text')
  createdAt: string;
}
