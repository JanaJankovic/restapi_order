import { HttpService } from '@nestjs/axios';
import {
  ARTICLE_ENDPOINTS,
  AUTH_ENDPOINTS,
  INVENTORY_ENDPOINTS,
  PAYMENT_ENDPOINTS,
} from 'src/global/constants';
import { map, catchError } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { UserVerificationDto } from 'src/models/user.dto';
import { MessageDto } from 'src/models/message.dto';
import { stringify } from 'querystring';

@Injectable()
export class NetworkService {
  constructor(private readonly httpService: HttpService) {}

  async getArticlesFromIds(
    ids: string[],
    correlationId?: string,
  ): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.ARTICLE_SERVICE_URL + ARTICLE_ENDPOINTS.articlesById,
          {
            data: ids,
            correlationId: correlationId,
          },
        )
        .pipe(
          map((res) => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async getInventoriesFromArticleIds(
    ids: string[],
    correlationId?: string,
  ): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.INVETORY_SERVICE_URL + INVENTORY_ENDPOINTS.getInventories,
          {
            data: ids,
            correlationId: correlationId,
          },
        )
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err): any => {
            throw err;
          }),
        ),
    );
  }

  async getTotalQuantity(id: string, correlationId?: string): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.INVETORY_SERVICE_URL +
            INVENTORY_ENDPOINTS.getTotalQuantity +
            id,
          { correlationId: correlationId },
        )
        .pipe(
          map((res) => {
            return res.data?.totalQuantity;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async updateInventory(
    article_id: string,
    quantity: number,
    correlationId?: string,
  ): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .put(
          process.env.INVETORY_SERVICE_URL +
            INVENTORY_ENDPOINTS.decrementQuantity,
          {
            articleId: article_id,
            quantity: quantity,
            correlationId: correlationId,
          },
        )
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async updateStats(url: string) {
    return await lastValueFrom(
      this.httpService
        .post(process.env.STATS_ENDPOINT, { url: url })
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async verifyUser(token, correlationId?: string): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.AUTH_SERVICE_URL + AUTH_ENDPOINTS.postVerifyUser,
          { correlationId: correlationId },
          {
            headers: {
              Authorization: token,
            },
          },
        )
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async getCardByUserId(
    token,
    id: string,
    correlationId?: string,
  ): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.PAYMENT_SERVICE_URL + PAYMENT_ENDPOINTS.postCardUser + id,
          { correlationId: correlationId },
          {
            headers: {
              Authorization: token,
            },
          },
        )
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }

  async postTransaction(
    token,
    card_id: string,
    order_id: string,
    correlationId?: string,
  ): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(
          process.env.PAYMENT_SERVICE_URL + PAYMENT_ENDPOINTS.postTransactions,
          {
            card_id: card_id,
            order_id: order_id,
            correlationId: correlationId,
          },
          {
            headers: {
              Authorization: token,
            },
          },
        )
        .pipe(
          map((res): any => {
            return res.data;
          }),
        )
        .pipe(
          catchError((err) => {
            throw err;
          }),
        ),
    );
  }
}
