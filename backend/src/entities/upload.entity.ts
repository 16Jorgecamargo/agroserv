import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { UploadPurpose } from '../types/index.js';
import { User } from './user.entity.js';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @Index()
  @Column('text')
  url: string;

  @Column('text')
  name: string;

  @Column('text')
  contentType: string;

  @Column('integer')
  size: number;

  @Column('text', { default: 'public' })
  purpose: UploadPurpose;

  @Column('text')
  fileName: string;

  @Column('text')
  createdAt: string;
}
