import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { ServiceRequest } from './service-request.entity.js';
import { Service } from './service.entity.js';
import { User } from './user.entity.js';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('text')
  requestId: string;

  @ManyToOne(() => ServiceRequest)
  @JoinColumn({ name: 'requestId' })
  request?: Relation<ServiceRequest>;

  @Index()
  @Column('text')
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'serviceId' })
  service?: Relation<Service>;

  @Column('text')
  serviceTitle: string;

  @Index()
  @Column('text')
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider?: Relation<User>;

  @Column('text')
  producerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'producerId' })
  producer?: Relation<User>;

  @Column('text')
  producerName: string;

  @Column('integer')
  rating: number;

  @Column('text', { nullable: true })
  comment: string | null;

  @Column('text', { nullable: true })
  replyText: string | null;

  @Column('text', { nullable: true })
  replyCreatedAt: string | null;

  @Column('text', { nullable: true })
  replyUpdatedAt: string | null;

  @Column('boolean', { default: false })
  hidden: boolean;

  @Column('text')
  editableUntil: string;

  @Column('text')
  createdAt: string;

  @Column('text')
  updatedAt: string;
}
