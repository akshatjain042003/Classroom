import { Test, TestingModule } from '@nestjs/testing';
import { WhiteboardController } from './whiteboard.controller';
import { WhiteboardService } from './whiteboard.service';

describe('WhiteboardController', () => {
  let controller: WhiteboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhiteboardController],
      providers: [WhiteboardService],
    }).compile();

    controller = module.get<WhiteboardController>(WhiteboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
