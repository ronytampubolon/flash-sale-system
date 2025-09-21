import { PurchaseOrderDto, PurchaseStatusDto } from "../dtos/order";
import { IFlashSaleService, IOrderService } from "./interface";
import orderModels from "../models/order.models";
import { appConfig, singleFlashProduct } from "../config/app";
import { IProgramStatus } from "../dtos/program.status";
import { BadRequestException } from "../exceptions/badrequest.exception";
import { PurchaseStatus } from "../types";
import { NotFoundException } from "../exceptions/notfound.exception";
import { inject, injectable } from "tsyringe";
import { publishMessage } from "../config/rabbitmq";
import { redisClient } from "../config/redis";

@injectable()
class OrderService implements IOrderService {

    constructor(@inject('IFlashSaleService') private flashService: IFlashSaleService) { }
    async purchase(request: PurchaseOrderDto): Promise<PurchaseStatusDto> {
        // check if program still applicable 
        const programStatus: IProgramStatus = await this.flashService.getStatus();
        if (!programStatus.isActive) {
            throw new BadRequestException("Program is Inactive")
        }
        if (request.productId != singleFlashProduct.id) {
            throw new BadRequestException("Product id not match")
        }
        // check if the qty is still available
        const productKey = `product:${request.productId}:stock`;
        
        // Get current stock from Redis
        const currentStock = await redisClient.get(productKey);
        
        if (!currentStock || parseInt(currentStock) <= 0) {
            throw new BadRequestException("Product is out of stock");
        }
        
        // Atomically decrease stock using Redis DECR
        const newStock = await redisClient.decr(productKey);
        
        // If stock goes negative, increment it back and throw error
        if (newStock < 0) {
            await redisClient.incr(productKey);
            throw new BadRequestException("Product is out of stock");
        }
        console.log(`Stock decreased for product ${request.productId}. Remaining: ${newStock}`);

        // publish to RabbitMQ Queue
        await publishMessage(appConfig.orderQueue.topic, JSON.stringify(request));
        return {
            status: PurchaseStatus.Pending,
        }
    }
    async getStatus(userId: string): Promise<PurchaseStatusDto> {
        const order = await orderModels.findOne({
            userId,
            status: 'completed',
        });
        if (!order) {
            throw new NotFoundException("Order not found");
        }
        return {
            status: order?.status as PurchaseStatus,
        };
    }

}
export default OrderService;