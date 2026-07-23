import { Test, TestingModule } from '@nestjs/testing';
import { WhiteboardService } from './whiteboard.service';

describe('WhiteboardService', () => {
  let service: WhiteboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhiteboardService],
    }).compile();

    service = module.get<WhiteboardService>(WhiteboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
