import { Inject, Injectable } from '@nestjs/common';
import { Channel } from 'amqplib';
import { RABBITMQ_QUEUE } from 'src/global/constants';

@Injectable()
export class MessageService {
  constructor(@Inject('CHANNEL') private readonly channel: Channel) {
    this.init();
  }

  async init() {
    await this.channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
  }

  async sendMessage(message: string) {
    this.channel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(message));
  }
}
