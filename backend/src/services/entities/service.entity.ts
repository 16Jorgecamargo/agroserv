import {
  Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne,
  PrimaryGeneratedColumn, type Relation,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import type { PriceUnit, ServiceStatus } from '../../common/types.js';
import { Equipment } from '../../equipment/entities/equipment.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('text')
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category?: Relation<Category>;

  @Index()
  @Column('text')
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<User>;

  @ManyToMany(() => Equipment, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'service_equipment' })
  equipment?: Relation<Equipment[]>;

  @Column('text')
  city: string;

  @Column('text')
  state: string;

  @Column('real')
  price: number;

  @Column('text')
  priceUnit: PriceUnit;

  @Column('real', { default: 0 })
  rating: number;

  @Column('integer', { default: 0 })
  reviewCount: number;

  @Column('boolean', { default: true })
  available: boolean;

  @Column('simple-json')
  photos: string[];

  @Column('text', { default: 'active' })
  status: ServiceStatus;

  @Column('text', { nullable: true })
  hiddenReason: string | null;

  @Column('text', { nullable: true })
  statusBeforeHidden: ServiceStatus | null;

  @Column('boolean', { default: false })
  hiddenByAccountDeletion: boolean;

  @Column('text', { default: '' })
  searchText: string;

  @Column('text', { default: '' })
  locationText: string;

  @Column('text')
  createdAt: string;

  @Column('text', { nullable: true })
  deletedAt: string | null;
}
