import { TransactionDto } from './transaction.dto';

export class CardDto {
  card_number: string;
  user_id: string;
  expiration: string;
  cvv: string;
  balance: number;
  transactions: TransactionDto[];
}
