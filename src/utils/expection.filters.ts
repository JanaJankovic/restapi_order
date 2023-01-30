import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { v4 } from 'uuid';
import { Utils } from './utils';
import { MessageService } from 'src/services/message.service';

@Catch()
export class BadRequestFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    response.status(400).json({ content: exception.message, error: true });
  }
}

@Catch(MongoError)
export class MongoFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    if (exception.code === 11000) {
      response
        .status(400)
        .json({ content: 'User already exists.', error: true });
    } else {
      response.status(500).json({ content: 'Internal error.', error: true });
    }
  }
}

@Catch()
@Injectable()
export class NetworkExceptionFilter {
  constructor(private messageService: MessageService) {}

  catch(exception: HttpException, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      content: exception.message || null,
      error: true,
    };

    this.messageService.sendMessage(
      Utils.createMessage(v4(), request.url, 'ERROR', exception.message),
    );

    response.status(status).json(errorResponse);
  }
}
