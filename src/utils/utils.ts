import * as moment from 'moment';
import { APPLICATION_NAME } from 'src/global/constants';

export class Utils {
  public static createMessage(
    id: string,
    url: string,
    type: string,
    message: string,
  ): string {
    const datetime = moment().format('YYYY-MM-DD HH:mm:ss');
    return `${datetime}, ${type} http://localhost:${process.env.PORT}${url} Correlation: ${id} [${APPLICATION_NAME}] - ${message}`;
  }
}
