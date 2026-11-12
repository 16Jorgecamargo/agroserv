import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { User } from './user.entity.js';

@Entity('blocked_days')
@Index(['providerId', 'date'], { unique: true })
export class BlockedDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<User>;

  @Column('text')
  date: string;
}
