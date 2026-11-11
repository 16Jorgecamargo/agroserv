import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('text')
  email: string;

  @Column('text')
  createdAt: string;
}
