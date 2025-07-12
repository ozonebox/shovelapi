import { Controller ,Get} from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

    @Get('savedinfo')
    getTerms() {
      return {
        title: 'Saved Information',
        content: this.dataService.getSavedInfo(),
      };
    }
  
}
