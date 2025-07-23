import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // 'credit' | 'debit'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'SUCCESS' })
  status: string;

  @Column({ nullable: true })
  gateway: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}
