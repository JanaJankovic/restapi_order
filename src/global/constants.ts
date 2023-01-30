export const MONGO_CONNECTION_STRING =
  'mongodb+srv://admin:admin@cluster0.zkv8jtt.mongodb.net/?retryWrites=true&w=majority';
export const RABBITMQ_EXCHANGE = 'iir-rv1-2';
export const RABBITMQ_QUEUE = 'iir-rv1-2';

export const APPLICATION_NAME = 'order.service';

export const ARTICLE_ENDPOINTS = {
  articlesById: '/articles/list',
};

export const INVENTORY_ENDPOINTS = {
  getInventories: '/inventories/list',
  getTotalQuantity: '/inventories/quantity/',
  decrementQuantity: '/inventories/purchased',
};

export const AUTH_ENDPOINTS = {
  postVerifyUser: '/verify',
};

export const PAYMENT_ENDPOINTS = {
  postCardUser: '/card/user/',
  postTransactions: '/transactions',
};

export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
