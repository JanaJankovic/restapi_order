export const MONGO_CONNECTION_STRING =
  'mongodb+srv://admin:admin@cluster0.zkv8jtt.mongodb.net/?retryWrites=true&w=majority';
export const ARTICLE_SERVICE_URL =
  /*process.env.ARTICLE_SERVICE_URL; */ 'http://localhost:3001';
export const INVETORY_SERVICE_URL =
  /*process.env.INVETORY_SERVICE_URL;*/ 'http://localhost:3002';
export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL; /*"http://localhost:3033" */
export const NOTIFICATION_SERVICE =
  process.env.NOTIFICATION_SERVICE; /*"http://localhost:3034" */

export const CURRENT_PORT = 3000;
export const APPLICATION_NAME = 'order.service';

export const RABBIT_MQ = 'amqp://guest:guest@localhost:5672';
export const RABBITMQ_EXCHANGE = 'iir-2';
export const RABBITMQ_QUEUE = 'iir-2';

export const ARTICLE_ENDPOINTS = {
  articlesById: '/articles/list',
};

export const INVENTORY_ENDPOINTS = {
  getInventories: '/inventories/list',
  getTotalQuantity: '/inventories/quantity/',
  decrementQuantity: '/inventories/purchased',
};

export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
