import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BidEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  corpus: string;

  @Column()
  room: string;

  @Column()
  problem: string;

  @Column({ nullable: true })
  file_url?: string;

  @CreateDateColumn()
  createdAt: Date;
}
