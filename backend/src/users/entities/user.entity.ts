import { Stroke } from 'src/whiteboard/entities/stroke.entity';
import { Whiteboard } from 'src/whiteboard/entities/whiteboard.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  googleid: string;

  @OneToMany(() => Whiteboard, (board) => board.userid)
  boards: Whiteboard[];

  @Column('varchar', { length: 255 })
  email: string;

  @Column('varchar', { length: 255 })
  firstname: string;

  @Column('varchar', { length: 255 })
  lastname: string;

  @Column({ type: 'text', nullable: true })
  picture: string | undefined;

  @OneToMany(() => Stroke, (stroke) => stroke.userid)
  strokes: Stroke[];

  @Column({ type: 'text', nullable: true })
  accesstoken: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'createdat' })
  createdat: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'upddate' })
  upddate: Date;

  @Column('varchar', { length: 255 })
  username: string;

  @Column('varchar', { length: 255, nullable: true })
  password: string | null;
}
