import 'reflect-metadata';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import OrderController from '../../controllers/order.controller';
import { IOrderService } from '../../services/interface';
import { PurchaseOrderDto, PurchaseStatusDto } from '../../dtos/order';
import { PurchaseStatus } from '../../types';
import { sendResponse } from '../../utils/response';
import { purchaseSchema } from '../../controllers/schema';

// Mock dependencies
jest.mock('../../utils/response');
jest.mock('../../controllers/schema');

const mockSendResponse = sendResponse as jest.MockedFunction<typeof sendResponse>;
const mockPurchaseSchema = purchaseSchema as jest.Mocked<typeof purchaseSchema>;

interface AuthenticatedRequest extends Request {
    user?: {
        userData: {
            id: string;
        };
    };
}

describe('OrderController', () => {
    let orderController: OrderController;
    let mockOrderService: jest.Mocked<IOrderService>;
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset container
        container.clearInstances();

        // Create mock service
        mockOrderService = {
            purchase: jest.fn(),
            getStatus: jest.fn(),
        };

        // Mock container registration and resolution
        jest.spyOn(container, 'register').mockImplementation();
        jest.spyOn(container, 'resolve').mockReturnValue(mockOrderService as any);

        // Create controller instance
        orderController = new OrderController(mockOrderService);

        // Create mock request and response objects
        mockRequest = {
            body: {},
            user: {
                userData: {
                    id: 'user123'
                }
            }
        } as any;

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as any;

        // Mock sendResponse
        mockSendResponse.mockImplementation();
    });

    afterEach(() => {
        container.clearInstances();
    });

    describe('purchase', () => {
        describe('Successful Purchase Scenarios', () => {
            it('should successfully process a valid purchase request', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                const expectedPurchaseDto: PurchaseOrderDto = {
                    productId: '10001',
                    userId: 'user123'
                };
                const purchaseResult: PurchaseStatusDto = {
                    status: PurchaseStatus.Completed
                };

                mockRequest.body = requestBody;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
                mockOrderService.purchase.mockResolvedValue(purchaseResult);

                // Act
                await orderController.purchase(mockRequest as AuthenticatedRequest, mockResponse as Response);

                // Assert
                expect(mockPurchaseSchema.parse).toHaveBeenCalledWith(requestBody);
                expect(mockOrderService.purchase).toHaveBeenCalledWith(expectedPurchaseDto);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Purchase successful',
                    purchaseResult
                );
            });

            it('should handle purchase with different product IDs', async () => {
                // Arrange
                const requestBody = { productId: '20002' };
                const expectedPurchaseDto: PurchaseOrderDto = {
                    productId: '20002',
                    userId: 'user123'
                };
                const purchaseResult: PurchaseStatusDto = {
                    status: PurchaseStatus.Pending
                };

                mockRequest.body = requestBody;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
                mockOrderService.purchase.mockResolvedValue(purchaseResult);

                // Act
                await orderController.purchase(mockRequest as AuthenticatedRequest, mockResponse as Response);

                // Assert
                expect(mockOrderService.purchase).toHaveBeenCalledWith(expectedPurchaseDto);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Purchase successful',
                    purchaseResult
                );
            });

            it('should correctly extract userId from authenticated user', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                const differentUserId = 'different-user-456';
                mockRequest.user = {
                    userData: {
                        id: differentUserId
                    }
                } as any;

                const expectedPurchaseDto: PurchaseOrderDto = {
                    productId: '10001',
                    userId: differentUserId
                };

                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
                mockOrderService.purchase.mockResolvedValue({ status: PurchaseStatus.Completed });

                // Act
                await orderController.purchase(mockRequest as AuthenticatedRequest, mockResponse as Response);

                // Assert
                expect(mockOrderService.purchase).toHaveBeenCalledWith(expectedPurchaseDto);
            });
        });

        describe('Validation Scenarios', () => {
            it('should handle schema validation errors', async () => {
                // Arrange
                const invalidRequestBody = { invalidField: 'invalid' };
                const validationError = new Error('Validation failed');
                
                mockRequest.body = invalidRequestBody;
                mockPurchaseSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(orderController.purchase(mockRequest as AuthenticatedRequest, mockResponse as Response))
                    .rejects.toThrow('Validation failed');

                expect(mockPurchaseSchema.parse).toHaveBeenCalledWith(invalidRequestBody);
                expect(mockOrderService.purchase).not.toHaveBeenCalled();
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle empty request body', async () => {
                // Arrange
                const emptyBody = {};
                const validationError = new Error('Product ID is required');
                
                mockRequest.body = emptyBody;
                mockPurchaseSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(orderController.purchase(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Product ID is required');

                expect(mockPurchaseSchema.parse).toHaveBeenCalledWith(emptyBody);
            });

            it('should handle missing productId in request body', async () => {
                // Arrange
                const bodyWithoutProductId = { otherField: 'value' };
                const validationError = new Error('productId is required');
                
                mockRequest.body = bodyWithoutProductId;
                mockPurchaseSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(orderController.purchase(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('productId is required');
            });
        });

        describe('Service Error Scenarios', () => {
            it('should handle service errors during purchase', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                const serviceError = new Error('Service unavailable');
                
                mockRequest.body = requestBody;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
                mockOrderService.purchase.mockRejectedValue(serviceError);

                // Act & Assert
                await expect(orderController.purchase(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Service unavailable');

                expect(mockOrderService.purchase).toHaveBeenCalled();
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle timeout errors', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                const timeoutError = new Error('Request timeout');
                
                mockRequest.body = requestBody;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
                mockOrderService.purchase.mockRejectedValue(timeoutError);

                // Act & Assert
                await expect(orderController.purchase(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Request timeout');
            });
        });

        describe('Authentication Edge Cases', () => {
        

            it('should handle missing userData in user object', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                mockRequest.user = {} as any;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);

                // Act & Assert
                await expect(orderController.purchase(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow();
            });

            it('should handle missing id in userData', async () => {
                // Arrange
                const requestBody = { productId: '10001' };
                mockRequest.user = {
                    userData: {}
                } as any;
                mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);

                // Act & Assert
                const expectedPurchaseDto: PurchaseOrderDto = {
                    productId: '10001',
                    userId: undefined
                };

                mockOrderService.purchase.mockResolvedValue({ status: PurchaseStatus.Completed });

                await orderController.purchase(mockRequest as Request, mockResponse as Response);

                expect(mockOrderService.purchase).toHaveBeenCalledWith(expectedPurchaseDto);
            });
        });
    });

    describe('getStatus', () => {
        describe('Successful Status Retrieval', () => {
            it('should successfully retrieve order status', async () => {
                // Arrange
                const userId = 'user123';
                const statusResult: PurchaseStatusDto = {
                    status: PurchaseStatus.Completed
                };

                mockOrderService.getStatus.mockResolvedValue(statusResult);

                // Act
                await orderController.getStatus(mockRequest as AuthenticatedRequest, mockResponse as Response);

                // Assert
                expect(mockOrderService.getStatus).toHaveBeenCalledWith(userId);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Order status',
                    statusResult
                );
            });

            it('should handle different user IDs', async () => {
                // Arrange
                const differentUserId = 'different-user-789';
                mockRequest.user = {
                    userData: {
                        id: differentUserId
                    }
                } as any;

                const statusResult: PurchaseStatusDto = {
                    status: PurchaseStatus.Pending
                };

                mockOrderService.getStatus.mockResolvedValue(statusResult);

                // Act
                await orderController.getStatus(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockOrderService.getStatus).toHaveBeenCalledWith(differentUserId);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Order status',
                    statusResult
                );
            });

            it('should handle different status types', async () => {
                // Arrange
                const statusResults = [
                    { status: PurchaseStatus.Pending },
                    { status: PurchaseStatus.Completed },
                    { status: PurchaseStatus.Failed }
                ];

                for (const statusResult of statusResults) {
                    mockOrderService.getStatus.mockResolvedValue(statusResult);

                    // Act
                    await orderController.getStatus(mockRequest as Request, mockResponse as Response);

                    // Assert
                    expect(mockSendResponse).toHaveBeenCalledWith(
                        mockResponse,
                        200,
                        'Order status',
                        statusResult
                    );
                }
            });
        });

        describe('Service Error Scenarios', () => {
            it('should handle service errors during status retrieval', async () => {
                // Arrange
                const serviceError = new Error('Database connection failed');
                mockOrderService.getStatus.mockRejectedValue(serviceError);

                // Act & Assert
                await expect(orderController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Database connection failed');

                expect(mockOrderService.getStatus).toHaveBeenCalledWith('user123');
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle not found errors', async () => {
                // Arrange
                const notFoundError = new Error('Order not found');
                mockOrderService.getStatus.mockRejectedValue(notFoundError);

                // Act & Assert
                await expect(orderController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Order not found');
            });
        });

        describe('Authentication Edge Cases', () => {
            it('should handle missing user object in getStatus', async () => {
                // Arrange
                mockRequest.user = undefined;

                // Act & Assert
                await expect(orderController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow();
            });

            it('should handle missing userData in getStatus', async () => {
                // Arrange
                mockRequest.user = {} as any;

                // Act & Assert
                await expect(orderController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow();
            });

            it('should handle undefined userId in getStatus', async () => {
                // Arrange
                mockRequest.user = {
                    userData: {
                        id: undefined
                    }
                } as any;

                mockOrderService.getStatus.mockResolvedValue({ status: PurchaseStatus.Pending });

                // Act
                await orderController.getStatus(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockOrderService.getStatus).toHaveBeenCalledWith(undefined);
            });
        });
    });

    describe('Dependency Injection', () => {
        it('should be properly injectable', () => {
            // Arrange & Act
            const controller = new OrderController(mockOrderService);

            // Assert
            expect(controller).toBeInstanceOf(OrderController);
            expect(controller).toHaveProperty('purchase');
            expect(controller).toHaveProperty('getStatus');
        });

        it('should use injected service', async () => {
            // Arrange
            const requestBody = { productId: '10001' };
            mockRequest.body = requestBody;
            mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
            mockOrderService.purchase.mockResolvedValue({ status: PurchaseStatus.Completed });

            // Act
            await orderController.purchase(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockOrderService.purchase).toHaveBeenCalled();
        });
    });

    describe('Response Handling', () => {
        it('should call sendResponse with correct parameters for purchase', async () => {
            // Arrange
            const requestBody = { productId: '10001' };
            const purchaseResult = { status: PurchaseStatus.Completed };
            
            mockRequest.body = requestBody;
            mockPurchaseSchema.parse = jest.fn().mockReturnValue(requestBody);
            mockOrderService.purchase.mockResolvedValue(purchaseResult);

            // Act
            await orderController.purchase(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockSendResponse).toHaveBeenCalledTimes(1);
            expect(mockSendResponse).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Purchase successful',
                purchaseResult
            );
        });

        it('should call sendResponse with correct parameters for getStatus', async () => {
            // Arrange
            const statusResult = { status: PurchaseStatus.Completed };
            mockOrderService.getStatus.mockResolvedValue(statusResult);

            // Act
            await orderController.getStatus(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockSendResponse).toHaveBeenCalledTimes(1);
            expect(mockSendResponse).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Order status',
                statusResult
            );
        });
    });
});