import { Inject, Injectable } from '@nestjs/common';
import { Channel } from 'amqplib';
import { RABBITMQ_QUEUE } from 'src/global/constants';

@Injectable()
export class MessageService {
  constructor(@Inject('CHANNEL') private readonly channel: Channel) {}

  async sendMessage(message: string) {
    await this.channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
    this.channel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(message));
  }
}
