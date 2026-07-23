import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stroke } from './stroke.entity';

@Entity({
  name: 'boards',
})
export class Whiteboard {
  @PrimaryGeneratedColumn()
  boardid: number;

  @ManyToOne(() => User, (user) => user.boards)
  @JoinColumn({ name: 'userid' })
  userid: User;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('varchar', { length: 255 })
  backgroundcolor: string;

  @CreateDateColumn({ type: 'timestamp', name: 'createdat' })
  createdat: Date;

  @OneToMany(() => Stroke, (stroke) => stroke.boardid)
  stroke: Stroke[];

  @UpdateDateColumn({ type: 'timestamp', name: 'upddated' })
  upddated: Date;
}
