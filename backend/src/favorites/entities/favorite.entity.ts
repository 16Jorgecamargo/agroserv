import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Service } from '../../services/entities/service.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('favorites')
@Index(['producerId', 'serviceId'], { unique: true })
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  producerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producerId' })
  producer?: Relation<User>;

  @Column('text')
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service?: Relation<Service>;

  @Column('text')
  createdAt: string;
}
