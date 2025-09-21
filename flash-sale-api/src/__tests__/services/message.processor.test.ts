import 'reflect-metadata';
import { container } from 'tsyringe';
import { MessageProcessor } from '../../services/message.processor';
import OrderQueueService from '../../services/order.queue.service';
import { LockMechanism } from '../../utils/lock.mechnism';
import { redisClient } from '../../config/redis';
import { PurchaseOrderDto } from '../../dtos/order';

// Mock dependencies
jest.mock('../../services/order.queue.service');
jest.mock('../../utils/lock.mechnism');
jest.mock('../../config/redis');

const MockedOrderQueueService = OrderQueueService as jest.MockedClass<typeof OrderQueueService>;
const MockedLockMechanism = LockMechanism as jest.MockedClass<typeof LockMechanism>;

describe('MessageProcessor', () => {
    let mockOrderQueueService: jest.Mocked<OrderQueueService>;
    let mockLockMechanism: jest.Mocked<LockMechanism>;
    let consoleSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset container
        container.clearInstances();
        
        // Create mock instances
        mockOrderQueueService = {
            processOrderQueue: jest.fn(),
        } as any;
        
        mockLockMechanism = {
            createLockFor: jest.fn(),
        } as any;

        // Mock container.resolve to return our mock service
        jest.spyOn(container, 'resolve').mockReturnValue(mockOrderQueueService);
        jest.spyOn(container, 'register').mockImplementation();

        // Mock console methods
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        container.clearInstances();
    });

    describe('processOrderMessage', () => {
        describe('Successful Order Processing', () => {
            it('should successfully process a valid order message', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(validOrder);

                // Assert
                expect(container.register).toHaveBeenCalledWith('RedisLock', {
                    useFactory: expect.any(Function)
                });
                expect(container.resolve).toHaveBeenCalledWith(OrderQueueService);
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(validOrder);
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: 10001, userId: user123'
                );
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Order message processed successfully for productId: 10001, userId: user123'
                );
            });

            it('should process order message without userId', async () => {
                // Arrange
                const orderWithoutUserId: PurchaseOrderDto = {
                    productId: '10001'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(orderWithoutUserId);

                // Assert
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(orderWithoutUserId);
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: 10001, userId: unknown'
                );
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Order message processed successfully for productId: 10001, userId: unknown'
                );
            });

            it('should handle order with undefined userId gracefully', async () => {
                // Arrange
                const orderWithUndefinedUserId: PurchaseOrderDto = {
                    productId: '10001',
                    userId: undefined
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(orderWithUndefinedUserId);

                // Assert
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(orderWithUndefinedUserId);
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: 10001, userId: unknown'
                );
            });

            it('should register RedisLock with correct factory function', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(validOrder);

                // Assert
                expect(container.register).toHaveBeenCalledWith('RedisLock', {
                    useFactory: expect.any(Function)
                });

                // Test the factory function
                const registerCall = (container.register as jest.Mock).mock.calls[0];
                const factoryFunction = registerCall[1].useFactory;
                const lockInstance = factoryFunction();
                expect(lockInstance).toBeInstanceOf(LockMechanism);
            });
        });

        describe('Error Handling', () => {
            it('should handle and re-throw errors from processOrderQueue', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                const processingError = new Error('Order processing failed');
                mockOrderQueueService.processOrderQueue.mockRejectedValue(processingError);

                // Act & Assert
                await expect(MessageProcessor.processOrderMessage(validOrder))
                    .rejects.toThrow('Order processing failed');

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error in processOrderMessage:', processingError);
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(validOrder);
            });

            it('should handle container resolution errors', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                const containerError = new Error('Container resolution failed');
                (container.resolve as jest.Mock).mockImplementation(() => {
                    throw containerError;
                });

                // Act & Assert
                await expect(MessageProcessor.processOrderMessage(validOrder))
                    .rejects.toThrow('Container resolution failed');

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error in processOrderMessage:', containerError);
            });

            it('should handle container registration errors', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                const registrationError = new Error('Container registration failed');
                (container.register as jest.Mock).mockImplementation(() => {
                    throw registrationError;
                });

                // Act & Assert
                await expect(MessageProcessor.processOrderMessage(validOrder))
                    .rejects.toThrow('Container registration failed');

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error in processOrderMessage:', registrationError);
            });

            it('should handle malformed message data', async () => {
                // Arrange
                const malformedMessage = null;

                // Act & Assert
                await expect(MessageProcessor.processOrderMessage(malformedMessage))
                    .rejects.toThrow();

                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should handle message with missing productId', async () => {
                // Arrange
                const invalidOrder = {
                    userId: 'user123'
                    // Missing productId
                } as any;
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(invalidOrder);

                // Assert
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: undefined, userId: user123'
                );
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(invalidOrder);
            });
        });

        describe('Edge Cases', () => {
          

            it('should handle message with extra properties', async () => {
                // Arrange
                const messageWithExtraProps = {
                    productId: '10001',
                    userId: 'user123',
                    extraProp: 'should be ignored',
                    anotherProp: 12345
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(messageWithExtraProps);

                // Assert
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(messageWithExtraProps);
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: 10001, userId: user123'
                );
            });

            it('should handle message with numeric productId', async () => {
                // Arrange
                const messageWithNumericId = {
                    productId: 10001, // Numeric instead of string
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(messageWithNumericId);

                // Assert
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Processing order message for productId: 10001, userId: user123'
                );
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledWith(messageWithNumericId);
            });

            
        });

        describe('Dependency Injection', () => {
            it('should register RedisLock with correct redis client', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(validOrder);

                // Assert
                const registerCall = (container.register as jest.Mock).mock.calls[0];
                const factoryFunction = registerCall[1].useFactory;
                
                // Mock the LockMechanism constructor to verify it's called with redisClient
                const lockInstance = factoryFunction();
                expect(MockedLockMechanism).toHaveBeenCalledWith(redisClient);
            });

            it('should resolve OrderQueueService from container', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(validOrder);

                // Assert
                expect(container.resolve).toHaveBeenCalledWith(OrderQueueService);
                expect(container.resolve).toHaveBeenCalledTimes(1);
            });
        });

        describe('Logging', () => {
            it('should log processing start and completion', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                await MessageProcessor.processOrderMessage(validOrder);

                // Assert
                expect(consoleSpy).toHaveBeenCalledTimes(2);
                expect(consoleSpy).toHaveBeenNthCalledWith(1,
                    'Processing order message for productId: 10001, userId: user123'
                );
                expect(consoleSpy).toHaveBeenNthCalledWith(2,
                    'Order message processed successfully for productId: 10001, userId: user123'
                );
            });

            it('should log errors with proper context', async () => {
                // Arrange
                const validOrder: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                const processingError = new Error('Processing failed');
                mockOrderQueueService.processOrderQueue.mockRejectedValue(processingError);

                // Act & Assert
                await expect(MessageProcessor.processOrderMessage(validOrder))
                    .rejects.toThrow('Processing failed');

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error in processOrderMessage:', processingError);
                expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            });
        });

        describe('Concurrent Processing', () => {
            it('should handle multiple concurrent message processing', async () => {
                // Arrange
                const orders = [
                    { productId: '10001', userId: 'user1' },
                    { productId: '10002', userId: 'user2' },
                    { productId: '10003', userId: 'user3' }
                ];
                mockOrderQueueService.processOrderQueue.mockResolvedValue();

                // Act
                const promises = orders.map(order => MessageProcessor.processOrderMessage(order));
                await Promise.all(promises);

                // Assert
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledTimes(3);
                expect(container.register).toHaveBeenCalledTimes(3);
                expect(container.resolve).toHaveBeenCalledTimes(3);
            });

            it('should handle mixed success and failure scenarios', async () => {
                // Arrange
                const orders = [
                    { productId: '10001', userId: 'user1' },
                    { productId: '10002', userId: 'user2' },
                    { productId: '10003', userId: 'user3' }
                ];
                
                mockOrderQueueService.processOrderQueue
                    .mockResolvedValueOnce() // First call succeeds
                    .mockRejectedValueOnce(new Error('Second call fails')) // Second call fails
                    .mockResolvedValueOnce(); // Third call succeeds

                // Act
                const promises = orders.map(order => 
                    MessageProcessor.processOrderMessage(order).catch(err => err)
                );
                const results = await Promise.all(promises);

                // Assert
                expect(results[0]).toBeUndefined(); // Success
                expect(results[1]).toBeInstanceOf(Error); // Failure
                expect(results[2]).toBeUndefined(); // Success
                expect(mockOrderQueueService.processOrderQueue).toHaveBeenCalledTimes(3);
            });
        });
    });
});