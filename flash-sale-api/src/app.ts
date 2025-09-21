import 'reflect-metadata';
import express, { Application, Router } from 'express';
import authRoutes from './routers/auth.route';
import flashSaleRoute from './routers/flashsales.route';
import orderRoutes from './routers/order.route';
import connectDB from './config/db';
import helmet from 'helmet';
import errorHandler from './middlewares/error';
import { connectRedis, initializeFlashSaleStock, redisClient } from './config/redis';
import { connectRabbitMQ, consumeMessages } from './config/rabbitmq';
import { appConfig, singleFlashProduct } from './config/app';
import { MessageProcessor } from './services/message.processor';
import cors from 'cors';

const app: Application = express();

app.use(cors({
  origin: 'http://localhost:3300', 
  credentials: false
}));
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginEmbedderPolicy: false
}));
// Connect to database
connectDB();
// connect to Redis and initialize stock
connectRedis().then(() => {
  initializeFlashSaleStock(singleFlashProduct.id, singleFlashProduct.stock);
});
// connect to RabbitMQ and start consuming messages
connectRabbitMQ().then(() => {
  // Start consuming messages from RabbitMQ
  consumeMessages(appConfig.orderQueue.topic, MessageProcessor.processOrderMessage);

});
// define API Router
const apiRouter = Router();
// Base Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/flash-sale', flashSaleRoute);
apiRouter.use('/orders', orderRoutes);
// global API router
app.use('/api', apiRouter);
// Optional: Root route
app.get('/health', (req, res) => {
  res.json({ message: 'Healthy' });
});
app.use(errorHandler);

export default app;