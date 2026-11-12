import { Column, Entity, Index, OneToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { Role, UserStatus } from '../types/index.js';
import { ProviderProfile } from './provider-profile.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Index({ unique: true })
  @Column('text')
  email: string;

  @Column('text', { select: false })
  passwordHash: string;

  @Column('text')
  role: Role;

  @Column('text', { nullable: true })
  phone: string | null;

  @Column('text', { nullable: true })
  avatarUrl: string | null;

  @Column('text')
  city: string;

  @Column('text')
  state: string;

  @Column('text', { default: 'active' })
  status: UserStatus;

  @Column('boolean', { default: false })
  mustChangePassword: boolean;

  @Column('text', { nullable: true })
  termsAcceptedAt: string | null;

  @Column('text', { default: '' })
  searchText: string;

  @Column('text')
  createdAt: string;

  @Column('text', { nullable: true })
  deletedAt: string | null;

  @OneToOne(() => ProviderProfile, (profile) => profile.user)
  providerProfile?: Relation<ProviderProfile>;
}
