import { Test, TestingModule } from '@nestjs/testing';
import { ResetaccountService } from './resetaccount.service';

describe('ResetaccountService', () => {
  let service: ResetaccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResetaccountService],
    }).compile();

    service = module.get<ResetaccountService>(ResetaccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
