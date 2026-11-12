import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @Index({ unique: true })
  @Column('text')
  tokenHash: string;

  @Column('text')
  expiresAt: string;

  @Column('text', { nullable: true })
  usedAt: string | null;

  @Column('text')
  createdAt: string;
}
