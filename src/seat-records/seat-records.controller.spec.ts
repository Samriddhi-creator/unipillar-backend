import { Test, TestingModule } from '@nestjs/testing';
import { SeatRecordsController } from './seat-records.controller';

describe('SeatRecordsController', () => {
  let controller: SeatRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeatRecordsController],
    }).compile();

    controller = module.get<SeatRecordsController>(SeatRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
