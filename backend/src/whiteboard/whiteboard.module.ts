import { Module } from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
import { WhiteboardController } from './whiteboard.controller';
import { Whiteboard } from './entities/whiteboard.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Stroke } from './entities/stroke.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Whiteboard,Stroke])],
  controllers: [WhiteboardController],
  providers: [WhiteboardService],
})
export class WhiteboardModule {}
