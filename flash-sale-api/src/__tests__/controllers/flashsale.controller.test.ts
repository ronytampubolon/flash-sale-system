import { Request, Response } from 'express';
import FlashSaleController from '../../controllers/flashsale.controller';
import { IFlashSaleService } from '../../services/interface';
import { sendResponse } from '../../utils/response';
import { IProgramStatus, IFlashProduct, ProgramStatus } from '../../dtos/program.status';

// Mock dependencies
jest.mock('../../utils/response');

describe('FlashSaleController', () => {
    let flashSaleController: FlashSaleController;
    let mockFlashSaleService: jest.Mocked<IFlashSaleService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockSendResponse: jest.MockedFunction<typeof sendResponse>;

    beforeEach(() => {
        // Mock FlashSaleService
        mockFlashSaleService = {
            getStatus: jest.fn(),
            getCatalog: jest.fn(),
        } as jest.Mocked<IFlashSaleService>;

        // Mock request and response
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock utility functions
        mockSendResponse = sendResponse as jest.MockedFunction<typeof sendResponse>;

        // Create controller instance
        flashSaleController = new FlashSaleController(mockFlashSaleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getStatus', () => {
        describe('successful status retrieval', () => {
            it('should return active flash sale status', async () => {
                // Arrange
                const activeStatus: IProgramStatus = {
                    isActive: true
                };
                mockFlashSaleService.getStatus.mockResolvedValue(activeStatus);

                // Act
                await flashSaleController.getStatus(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockFlashSaleService.getStatus).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Flash sale status true',
                    activeStatus
                );
            });

            it('should return inactive flash sale status', async () => {
                // Arrange
                const inactiveStatus: IProgramStatus = {
                    isActive: false
                };
                mockFlashSaleService.getStatus.mockResolvedValue(inactiveStatus);

                // Act
                await flashSaleController.getStatus(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockFlashSaleService.getStatus).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Flash sale status false',
                    inactiveStatus
                );
            });
        });

        describe('error scenarios', () => {
            it('should handle service errors during status retrieval', async () => {
                // Arrange
                const serviceError = new Error('Database connection failed');
                mockFlashSaleService.getStatus.mockRejectedValue(serviceError);

                // Act & Assert
                await expect(flashSaleController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Database connection failed');

                expect(mockFlashSaleService.getStatus).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle timeout errors', async () => {
                // Arrange
                const timeoutError = new Error('Request timeout');
                mockFlashSaleService.getStatus.mockRejectedValue(timeoutError);

                // Act & Assert
                await expect(flashSaleController.getStatus(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Request timeout');

                expect(mockFlashSaleService.getStatus).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('getProduct', () => {
        describe('successful product retrieval', () => {
            it('should return flash sale product catalog', async () => {
                // Arrange
                const flashProduct: IFlashProduct = {
                    id: '10001',
                    name: 'Flash Sale Product',
                    price: 99.99,
                    stock: 100,
                    thumbnail: 'https://example.com/product1.jpg'
                };
                mockFlashSaleService.getCatalog.mockResolvedValue(flashProduct);

                // Act
                await flashSaleController.getProduct(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockFlashSaleService.getCatalog).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Flash sale product',
                    flashProduct
                );
            });

            it('should handle product with zero stock', async () => {
                // Arrange
                const outOfStockProduct: IFlashProduct = {
                    id: '10002',
                    name: 'Sold Out Product',
                    price: 49.99,
                    stock: 0,
                    thumbnail: 'https://example.com/product2.jpg'
                };
                mockFlashSaleService.getCatalog.mockResolvedValue(outOfStockProduct);

                // Act
                await flashSaleController.getProduct(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockFlashSaleService.getCatalog).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Flash sale product',
                    outOfStockProduct
                );
            });

            it('should handle product with high stock', async () => {
                // Arrange
                const highStockProduct: IFlashProduct = {
                    id: '10003',
                    name: 'Popular Product',
                    price: 29.99,
                    stock: 1000,
                    thumbnail: 'https://example.com/product3.jpg'
                };
                mockFlashSaleService.getCatalog.mockResolvedValue(highStockProduct);

                // Act
                await flashSaleController.getProduct(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockFlashSaleService.getCatalog).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Flash sale product',
                    highStockProduct
                );
            });
        });

        describe('error scenarios', () => {
            it('should handle service errors during product retrieval', async () => {
                // Arrange
                const serviceError = new Error('Product service unavailable');
                mockFlashSaleService.getCatalog.mockRejectedValue(serviceError);

                // Act & Assert
                await expect(flashSaleController.getProduct(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Product service unavailable');

                expect(mockFlashSaleService.getCatalog).toHaveBeenCalledTimes(1);
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle product not found errors', async () => {
                // Arrange
                const notFoundError = new Error('Product not found');
                mockFlashSaleService.getCatalog.mockRejectedValue(notFoundError);

                // Act & Assert
                await expect(flashSaleController.getProduct(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Product not found');

                expect(mockFlashSaleService.getCatalog).toHaveBeenCalledTimes(1);
            });

            it('should handle network errors', async () => {
                // Arrange
                const networkError = new Error('Network error');
                mockFlashSaleService.getCatalog.mockRejectedValue(networkError);

                // Act & Assert
                await expect(flashSaleController.getProduct(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Network error');
            });
        });
    });

    describe('dependency injection', () => {
        it('should create controller with injected service', () => {
            // Arrange & Act
            const controller = new FlashSaleController(mockFlashSaleService);

            // Assert
            expect(controller).toBeInstanceOf(FlashSaleController);
            expect(controller).toHaveProperty('getStatus');
            expect(controller).toHaveProperty('getProduct');
        });

        it('should use injected service for status calls', async () => {
            // Arrange
            const status: IProgramStatus = { isActive: true };
            mockFlashSaleService.getStatus.mockResolvedValue(status);

            // Act
            await flashSaleController.getStatus(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFlashSaleService.getStatus).toHaveBeenCalled();
        });

        it('should use injected service for product calls', async () => {
            // Arrange
            const product: IFlashProduct = {
                id: '10001',
                name: 'Test Product',
                price: 99.99,
                stock: 50,
                thumbnail: 'https://example.com/test-product.jpg'
            };
            mockFlashSaleService.getCatalog.mockResolvedValue(product);

            // Act
            await flashSaleController.getProduct(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockFlashSaleService.getCatalog).toHaveBeenCalled();
        });
    });

    describe('response handling', () => {
        it('should call sendResponse with correct parameters for getStatus', async () => {
            // Arrange
            const status: IProgramStatus = { isActive: true };
            mockFlashSaleService.getStatus.mockResolvedValue(status);

            // Act
            await flashSaleController.getStatus(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockSendResponse).toHaveBeenCalledTimes(1);
            expect(mockSendResponse).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Flash sale status true',
                status
            );
        });

        it('should call sendResponse with correct parameters for getProduct', async () => {
            // Arrange
            const product: IFlashProduct = {
                id: '10001',
                name: 'Test Product',
                price: 99.99,
                stock: 50,
                thumbnail: 'https://example.com/test-product.jpg'
            };
            mockFlashSaleService.getCatalog.mockResolvedValue(product);

            // Act
            await flashSaleController.getProduct(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockSendResponse).toHaveBeenCalledTimes(1);
            expect(mockSendResponse).toHaveBeenCalledWith(
                mockResponse,
                200,
                'Flash sale product',
                product
            );
        });
    });
});