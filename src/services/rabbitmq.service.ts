import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  APPLICATION_NAME,
  CURRENT_PORT,
  DATETIME_FORMAT,
} from 'src/global/constants';
import * as moment from 'moment';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('rabbit-mq-module') private readonly client: ClientProxy,
  ) {}

  public publish(pattern: string, message: string) {
    return this.client.send(pattern, { data: message });
  }

  createMessage(
    id: string,
    url: string,
    type: string,
    message: string,
  ): string {
    const datetime = moment().format(DATETIME_FORMAT);
    return `${datetime}, ${type} http://localhost:${CURRENT_PORT}${url} Correlation: ${id} [${APPLICATION_NAME}] - ${message}`;
  }
}
