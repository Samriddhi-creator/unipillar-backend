import { Test, TestingModule } from '@nestjs/testing';
import { SeatRecordsService } from './seat-records.service';

describe('SeatRecordsService', () => {
  let service: SeatRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeatRecordsService],
    }).compile();

    service = module.get<SeatRecordsService>(SeatRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
