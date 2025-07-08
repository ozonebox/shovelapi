import { Test, TestingModule } from '@nestjs/testing';
import { ResetaccountController } from './resetaccount.controller';
import { ResetaccountService } from './resetaccount.service';

describe('ResetaccountController', () => {
  let controller: ResetaccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResetaccountController],
      providers: [ResetaccountService],
    }).compile();

    controller = module.get<ResetaccountController>(ResetaccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
