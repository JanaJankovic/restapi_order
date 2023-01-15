import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_QUEUE, RABBIT_MQ } from 'src/global/constants';

import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'rabbit-mq-module',
        transport: Transport.RMQ,
        options: {
          urls: [RABBIT_MQ],
          queue: RABBITMQ_QUEUE,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
