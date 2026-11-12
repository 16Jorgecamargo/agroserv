import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, type Relation } from 'typeorm';
import type { VerificationStatus } from '../types/index.js';
import { User } from './user.entity.js';

@Entity('provider_profiles')
export class ProviderProfile {
  @PrimaryColumn('text')
  userId: string;

  @OneToOne(() => User, (user) => user.providerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @Column('text', { default: '' })
  document: string;

  @Column('integer', { default: 50 })
  serviceRadiusKm: number;

  @Column('integer', { default: 0 })
  yearsOfExperience: number;

  @Column('text', { default: '' })
  description: string;

  @Column('text', { default: 'not_sent' })
  verificationStatus: VerificationStatus;

  @Column('text', { nullable: true })
  verificationRejectionReason: string | null;

  @Column('text', { nullable: true })
  identityUploadId: string | null;

  @Column('text', { nullable: true })
  addressUploadId: string | null;

  @Column('text', { nullable: true })
  verificationSubmittedAt: string | null;

  @Column('text', { nullable: true })
  verificationReviewedAt: string | null;

  @Column('real', { default: 0 })
  rating: number;

  @Column('integer', { default: 0 })
  reviewCount: number;
}
