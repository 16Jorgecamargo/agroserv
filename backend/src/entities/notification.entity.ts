import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { NotificationType } from '../types/index.js';
import { User } from './user.entity.js';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @Column('text')
  type: NotificationType;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  body: string | null;

  @Column('text')
  link: string;

  @Column('boolean', { default: false })
  read: boolean;

  @Column('text', { nullable: true })
  groupKey: string | null;

  @Column('text')
  createdAt: string;
}
