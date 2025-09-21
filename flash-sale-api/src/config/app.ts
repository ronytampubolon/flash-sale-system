import { IFlashProduct } from '../dtos/program.status';
import dotenv from 'dotenv';

dotenv.config();

const appConfig = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    dbUrl: process.env.DB_URL || 'mongodb://localhost:27017/flash-sale',
    jwtSecret: process.env.JWT_SECRET || 'secret',
    flashStatus: process.env.FLASH_STATUS || true,
    flashStart: process.env.FLASH_START,
    flashEnd: process.env.FLASH_END,
    flashStock: process.env.FLASH_STOCK || 1000,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redisPassword: process.env.REDIS_PASSWORD || '',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    rabbitmqPassword: process.env.RABBITMQ_PASSWORD || '',
    orderQueue: {
        topic: 'order.purchase',
    }
    
}
const singleFlashProduct: IFlashProduct = {
    id: "10001",
    name: "iPhone 16 Pro",
    price: 3100,
    stock: 1000,
    thumbnail: "https://www.apple.com/v/iphone-16-pro/f/images/overview/contrast/iphone_16_pro__erqf8e51gl4y_xlarge_2x.jpg",
}
export { appConfig, singleFlashProduct }
