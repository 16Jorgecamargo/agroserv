import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  producerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'producerId' })
  producer?: Relation<User>;

  @Column('text')
  name: string;

  @Column('text')
  city: string;

  @Column('text')
  state: string;

  @Column('text', { default: '' })
  accessNotes: string;

  @Column('real')
  areaHectares: number;

  @Column('simple-json')
  crops: string[];

  @Column('text')
  createdAt: string;

  @Column('text', { nullable: true })
  deletedAt: string | null;
}
