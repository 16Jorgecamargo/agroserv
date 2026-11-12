import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { CategoryIcon } from '../types/index.js';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  slug: string;

  @Column('text')
  name: string;

  @Column('text')
  icon: CategoryIcon;

  @Column('boolean', { default: true })
  active: boolean;

  @Column('text')
  createdAt: string;
}
