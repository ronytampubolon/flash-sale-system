import { createClient } from 'redis';
import { appConfig, singleFlashProduct } from './app';

export const redisClient = createClient({ url: appConfig.redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis client error', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis:', appConfig.redisUrl);
  }
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
    console.log('Disconnected from Redis');
  }
}
export async function initializeFlashSaleStock(productId: string, stock: number) {
    try {
        const productKey = `product:${productId}:stock`;
        
        // Check if stock already exists
        const existingStock = await redisClient.get(productKey);
        
        if (!existingStock) {
            // Initialize stock with the configured flash stock amount
            await redisClient.set(productKey, singleFlashProduct.stock.toString());
            console.log(`Initialized stock for product ${singleFlashProduct.id}: ${singleFlashProduct.stock} units`);
        } else {
            console.log(`Stock already exists for product ${singleFlashProduct.id}: ${existingStock} units`);
        }
    } catch (error) {
        console.error('Failed to initialize flash sale stock:', error);
    }
}
