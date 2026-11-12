import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type {
  ReportReason, ReportResolutionAction, ReportStatus, ReportTargetType, Role,
} from '../types/index.js';
import { User } from './user.entity.js';

export interface ReportResolution {
  action: ReportResolutionAction;
  targetUserId?: string;
  message?: string;
  internalNote: string;
  adminId: string;
  adminName: string;
  resolvedAt: string;
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter?: Relation<User>;

  @Column('text')
  reporterName: string;

  @Column('text')
  reporterRole: Role;

  @Column('text')
  targetType: ReportTargetType;

  @Index()
  @Column('text')
  targetId: string;

  @Column('text')
  targetLabel: string;

  @Column('text')
  reason: ReportReason;

  @Column('text')
  description: string;

  @Index()
  @Column('text', { default: 'open' })
  status: ReportStatus;

  @Column('simple-json', { nullable: true })
  resolution: ReportResolution | null;

  @Column('text')
  createdAt: string;
}
