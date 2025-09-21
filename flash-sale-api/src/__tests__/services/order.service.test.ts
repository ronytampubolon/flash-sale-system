import 'reflect-metadata';
import { container } from 'tsyringe';
import OrderService from '../../services/order.service';
import { IFlashSaleService } from '../../services/interface';
import { redisClient } from '../../config/redis';
import { publishMessage } from '../../config/rabbitmq';
import orderModels from '../../models/order.models';
import { PurchaseOrderDto } from '../../dtos/order';
import { PurchaseStatus } from '../../types';
import { BadRequestException } from '../../exceptions/badrequest.exception';
import { NotFoundException } from '../../exceptions/notfound.exception';
import { singleFlashProduct } from '../../config/app';

// Mock dependencies
jest.mock('../../config/redis');
jest.mock('../../config/rabbitmq');
jest.mock('../../models/order.models');

const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockPublishMessage = publishMessage as jest.MockedFunction<typeof publishMessage>;
const mockOrderModels = orderModels as jest.Mocked<typeof orderModels>;

// Mock FlashSaleService
const mockFlashSaleService: jest.Mocked<IFlashSaleService> = {
    getStatus: jest.fn(),
    getCatalog: jest.fn(),
};

describe('OrderService', () => {
    let orderService: OrderService;
    const validOrderRequest: PurchaseOrderDto = {
        productId: singleFlashProduct.id,
        userId: 'test-user-123',
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Register mock dependencies
        container.clearInstances();
        container.register<IFlashSaleService>('IFlashSaleService', {
            useValue: mockFlashSaleService,
        });
        
        // Create service instance
        orderService = container.resolve(OrderService);
    });

    afterEach(() => {
        container.clearInstances();
    });

    describe('purchase', () => {
        beforeEach(() => {
            // Default mock setup for successful scenarios
            mockFlashSaleService.getStatus.mockResolvedValue({
                isActive: true,
            });
        });

        describe('Program Status Validation', () => {
            it('should throw BadRequestException when program is inactive', async () => {
                // Arrange
                mockFlashSaleService.getStatus.mockResolvedValue({
                    isActive: false,
                });

                // Act & Assert
                await expect(orderService.purchase(validOrderRequest))
                    .rejects
                    .toThrow(new BadRequestException('Program is Inactive'));
            });

            it('should proceed when program is active', async () => {
                // Arrange
                mockFlashSaleService.getStatus.mockResolvedValue({
                    isActive: true,
                });
                mockRedisClient.get.mockResolvedValue('10');
                mockRedisClient.decr.mockResolvedValue(9);
                mockPublishMessage.mockResolvedValue();

                // Act
                const result = await orderService.purchase(validOrderRequest);

                // Assert
                expect(result.status).toBe(PurchaseStatus.Pending);
            });
        });

        describe('Product ID Validation', () => {
            it('should throw BadRequestException for invalid product ID', async () => {
                // Arrange
                const invalidRequest: PurchaseOrderDto = {
                    ...validOrderRequest,
                    productId: 'invalid-product-id',
                };

                // Act & Assert
                await expect(orderService.purchase(invalidRequest))
                    .rejects
                    .toThrow(new BadRequestException('Product id not match'));
            });

            it('should proceed with valid product ID', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('5');
                mockRedisClient.decr.mockResolvedValue(4);
                mockPublishMessage.mockResolvedValue();

                // Act
                const result = await orderService.purchase(validOrderRequest);

                // Assert
                expect(result.status).toBe(PurchaseStatus.Pending);
            });
        });

        describe('Redis Stock Management', () => {
            

            it('should throw BadRequestException when stock is zero', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('0');

                // Act & Assert
                await expect(orderService.purchase(validOrderRequest))
                    .rejects
                    .toThrow(new BadRequestException('Product is out of stock'));
            });

            it('should throw BadRequestException when stock is negative', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('-1');

                // Act & Assert
                await expect(orderService.purchase(validOrderRequest))
                    .rejects
                    .toThrow(new BadRequestException('Product is out of stock'));
            });

            

            it('should handle atomic operations correctly', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('5');
                mockRedisClient.decr.mockResolvedValue(4);
                mockPublishMessage.mockResolvedValue();

                // Act
                await orderService.purchase(validOrderRequest);

                // Assert
                expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
                expect(mockRedisClient.decr).toHaveBeenCalledTimes(1);
                expect(mockRedisClient.incr).not.toHaveBeenCalled();
            });
        });

        describe('RabbitMQ Integration', () => {
            
            it('should handle RabbitMQ publish errors', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('10');
                mockRedisClient.decr.mockResolvedValue(9);
                mockPublishMessage.mockRejectedValue(new Error('RabbitMQ connection failed'));

                // Act & Assert
                await expect(orderService.purchase(validOrderRequest))
                    .rejects
                    .toThrow('RabbitMQ connection failed');
            });
        });

        describe('Success Scenarios', () => {
            it('should return pending status on successful purchase', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('10');
                mockRedisClient.decr.mockResolvedValue(9);
                mockPublishMessage.mockResolvedValue();

                // Act
                const result = await orderService.purchase(validOrderRequest);

                // Assert
                expect(result).toEqual({
                    status: PurchaseStatus.Pending,
                });
            });

            it('should handle edge case with stock = 1', async () => {
                // Arrange
                mockRedisClient.get.mockResolvedValue('1');
                mockRedisClient.decr.mockResolvedValue(0);
                mockPublishMessage.mockResolvedValue();

                // Act
                const result = await orderService.purchase(validOrderRequest);

                // Assert
                expect(result.status).toBe(PurchaseStatus.Pending);
                expect(mockRedisClient.decr).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('getStatus', () => {
        const userId = 'test-user-123';

        it('should return order status when order exists', async () => {
            // Arrange
            const mockOrder = {
                userId,
                status: 'completed',
                productId: singleFlashProduct.id,
            };
            mockOrderModels.findOne.mockResolvedValue(mockOrder as any);

            // Act
            const result = await orderService.getStatus(userId);

            // Assert
            expect(result).toEqual({
                status: PurchaseStatus.Completed,
            });
            expect(mockOrderModels.findOne).toHaveBeenCalledWith({
                userId,
                status: 'completed',
            });
        });

        it('should throw NotFoundException when order does not exist', async () => {
            // Arrange
            mockOrderModels.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(orderService.getStatus(userId))
                .rejects
                .toThrow(new NotFoundException('Order not found'));
        });

        it('should handle database errors', async () => {
            // Arrange
            mockOrderModels.findOne.mockRejectedValue(new Error('Database connection failed'));

            // Act & Assert
            await expect(orderService.getStatus(userId))
                .rejects
                .toThrow('Database connection failed');
        });
    });

    describe('Error Handling', () => {
        it('should handle Redis connection errors', async () => {
            // Arrange
            mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

            // Act & Assert
            await expect(orderService.purchase(validOrderRequest))
                .rejects
                .toThrow('Redis connection failed');
        });

        it('should handle FlashSaleService errors', async () => {
            // Arrange
            mockFlashSaleService.getStatus.mockRejectedValue(new Error('FlashSale service error'));

            // Act & Assert
            await expect(orderService.purchase(validOrderRequest))
                .rejects
                .toThrow('FlashSale service error');
        });
    });
});