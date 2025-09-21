import { container } from 'tsyringe';
import { PurchaseOrderDto } from '../dtos/order';
import OrderQueueService from './order.queue.service';
import { LockMechanism } from '../utils/lock.mechnism';
import { redisClient } from '../config/redis';

export class MessageProcessor {
    /**
     * Process order messages from RabbitMQ queue
     * @param messageData - The message data received from the queue
     */
    static async processOrderMessage(messageData: any): Promise<void> {
        try {
            // Parse the message data as order
            const order = messageData as PurchaseOrderDto;
            
            console.log(`Processing order message for productId: ${order.productId}, userId: ${order.userId || 'unknown'}`);
            
            // Register dependencies for OrderQueueService
            container.register<LockMechanism>('RedisLock', {
                useFactory: () => new LockMechanism(redisClient as any)
            });

            // Resolve and process the order
            const orderQueueService = container.resolve(OrderQueueService);
            await orderQueueService.processOrderQueue(order);
            
            console.log(`Order message processed successfully for productId: ${order.productId}, userId: ${order.userId || 'unknown'}`);
        } catch (error) {
            console.error('Error in processOrderMessage:', error);
            throw error; // Re-throw to let the consumer handle retry logic
        }
    }
}