import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { EquipmentType } from '../../common/types.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<User>;

  @Column('text')
  type: EquipmentType;

  @Column('text')
  model: string;

  @Column('integer')
  year: number;

  @Column('text', { default: '' })
  specs: string;

  @Column('simple-json')
  photos: string[];

  @Column('text')
  createdAt: string;
}
