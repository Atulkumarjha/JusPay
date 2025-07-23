import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: string;

  @Column()
  amount: number;

  @Column()
  gateway: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'json', nullable: true })
  gateway_response: any;

  @Column({ nullable: true })
  gateway_order_id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}
