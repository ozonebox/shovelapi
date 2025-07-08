import { Injectable } from '@nestjs/common';
import { CreateLegalDto } from './dto/create-legal.dto';
import { UpdateLegalDto } from './dto/update-legal.dto';
import { ConfigService } from '@nestjs/config';
import { sendResponse } from 'src/common/helpers/response.helpers';

@Injectable()
export class LegalService {
  constructor(
      private readonly configService: ConfigService,
      ) {}
  getTerms() {
    const terms:string =this.configService.get('TERMS') as string;
    return sendResponse({
              responsecode: '00',
              responsemessage: 'Request Successful',
              data:terms
            });
    }
  

  getPrivacy() {
    const privacy:string =this.configService.get('PRIVACY') as string;
    return sendResponse({
              responsecode: '00',
              responsemessage: 'Request Successful',
              data:privacy
            });
  }
}
