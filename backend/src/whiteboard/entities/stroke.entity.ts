import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Whiteboard } from './whiteboard.entity';
import { User } from 'src/users/entities/user.entity';


@Entity({
  name: 'stroke',
})
export class Stroke {
  @PrimaryGeneratedColumn()
  strokeid?: number;

  @ManyToOne(() => Whiteboard, (board) => board.stroke)
  @JoinColumn({ name: 'boardid' })
  boardid: Whiteboard;

  @ManyToOne(() => User, (user) => user.strokes)
  @JoinColumn({ name: 'userid' })
  userid: User;

  @Column({ type: 'json' })
  points: object;

  @Column('varchar', { length: 255 })
  color: string;

  @Column('decimal', { precision: 2, scale: 2 })
  opacity: number;

  @Column()
  thickness: number;

  @CreateDateColumn({ type: 'timestamp', name: 'createdat' })
  createdat: Date;
}
