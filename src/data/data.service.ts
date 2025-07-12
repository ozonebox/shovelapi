import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sendResponse } from 'src/common/helpers/response.helpers';

@Injectable()
export class DataService {
    constructor(
          private readonly configService: ConfigService,
          ) {}
      getSavedInfo() {
        const savedInfo:string =this.configService.get('SAVED_ADDRESS') as string;
        let sv = JSON.parse(savedInfo)
        return sendResponse({
                  responsecode: '00',
                  responsemessage: 'Request Successful',
                  savedInfo:sv
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
