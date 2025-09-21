import { inject, injectable } from "tsyringe";

import { LockMechanism } from "../utils/lock.mechnism";
import { PurchaseOrderDto } from "../dtos/order";
import { IOrderQueueService } from "./interface";
import orderModels from "../models/order.models";
import { singleFlashProduct } from "../config/app";

@injectable()
class OrderQueueService implements IOrderQueueService {
    constructor(@inject('RedisLock') private redisLock: LockMechanism) { }
   
    async processOrderQueue(request: PurchaseOrderDto): Promise<void> {
        // make sure no multiple order for the same product by the same user
        
        const lock = this.redisLock.createLockFor(request.productId + "_" + request.userId);
        console.log('Lock created for productId:', request.productId, 'userId:', request.userId);
        try {
            const handle = await lock.acquire();
            const createdOrder = await orderModels.create({
                userId: request.userId,
                itemId: request.productId,
                quantity: 1,// as default
                totalPrice: 1 * singleFlashProduct.price,
                status: 'completed',
            });
            await lock.release(handle);
            console.log('Order created:', createdOrder);
        } catch (error) {
            console.error('Lock operation failed:', error);
        }
    }
}
export default OrderQueueService;