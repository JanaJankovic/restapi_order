import { HttpService } from '@nestjs/axios';
import {
  ARTICLE_ENDPOINTS,
  ARTICLE_SERVICE_URL,
  INVENTORY_ENDPOINTS,
  INVETORY_SERVICE_URL,
} from 'src/global/constants';
import { map, catchError } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NetworkService {
  constructor(private readonly httpService: HttpService) {}

  async getArticlesFromIds(ids: string[]): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(ARTICLE_SERVICE_URL + ARTICLE_ENDPOINTS.articlesById, ids)
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

  async getInventoriesFromArticleIds(ids: string[]): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .post(INVETORY_SERVICE_URL + INVENTORY_ENDPOINTS.getInventories, ids)
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

  async getTotalQuantity(id: string): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .get(INVETORY_SERVICE_URL + INVENTORY_ENDPOINTS.getTotalQuantity + id)
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

  async updateInventory(article_id: string, quantity: number): Promise<any> {
    return await lastValueFrom(
      this.httpService
        .put(INVETORY_SERVICE_URL + INVENTORY_ENDPOINTS.decrementQuantity, {
          articleId: article_id,
          quantity: quantity,
        })
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
