import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';
import {
  APPLICATION_NAME,
  CURRENT_PORT,
  RABBITMQ_EXCHANGE,
  RABBIT_MQ,
  DATETIME_FORMAT,
  RABBITMQ_QUEUE,
} from 'src/global/constants';
import * as moment from 'moment';

@Injectable()
export class RabbitMQService {
  private channel: amqp.Channel;
  private conn;

  constructor() {
    this.init();
  }

  async init() {
    this.conn = await amqp.connect(RABBIT_MQ);
    this.channel = await this.conn.createChannel(CURRENT_PORT);
    this.channel.assertExchange(RABBITMQ_EXCHANGE, 'direct', { durable: true });
  }

  async publish(message: any) {
    await this.channel.sendToQueue(
      RABBITMQ_QUEUE,
      Buffer.from(JSON.stringify(message)),
    );
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
