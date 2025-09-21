import 'reflect-metadata';
import { container } from 'tsyringe';
import FlashSaleService from '../../services/flashsale.service';
import { appConfig, singleFlashProduct } from '../../config/app';
import { ProgramStatus } from '../../dtos/program.status';
import moment from 'moment';
// Mock the app config
jest.mock('../../config/app');

// Mock moment
jest.mock('moment', () => {
    const actualMoment = jest.requireActual('moment');
    const mockMoment = jest.fn((input?: any, format?: any) => {
        // If no input is provided, return our mocked current time
        if (input === undefined) {
            return actualMoment('2024-01-15 11:00:00');
        }
        // Otherwise, use the actual moment functionality for parsing
        return actualMoment(input, format);
    });
    
    // Copy all static methods from actual moment
    Object.setPrototypeOf(mockMoment, actualMoment);
    Object.assign(mockMoment, actualMoment);
    
    return {
        ...actualMoment,
        default: mockMoment,
        __esModule: true,
    };
});

const mockAppConfig = appConfig as jest.Mocked<typeof appConfig>;
const mockSingleFlashProduct = singleFlashProduct as jest.Mocked<typeof singleFlashProduct>;

describe('FlashSaleService', () => {
    let flashSaleService: FlashSaleService;
    const FLASH_START_FORMAT = "MM/DD/YYYY hh:mm:ss";

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset container
        container.clearInstances();
        
        // Create service instance
        flashSaleService = new FlashSaleService();
    });

    afterEach(() => {
        container.clearInstances();
    });

    describe('getStatus', () => {
        describe('Active Flash Sale Scenarios', () => {
            it('should return Active status when current time is within flash sale period', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 10:00:00'; // 1 hour before current time (11:00:00)
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';   // 3 hours after current time
                
                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Active);
                expect(result.isActive).toBe(true);
            });

            it('should return Inactive status when current time equals start time', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 11:00:00'; // Exactly current time
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should return InActive status when current time equals end time', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 10:00:00';
                mockAppConfig.flashEnd = '01/15/2024 11:00:00'; // Exactly current time

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should return Active status for a very short flash sale window', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 10:59:59';
                mockAppConfig.flashEnd = '01/15/2024 11:00:01'; // 2-second window around current time

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Active);
                expect(result.isActive).toBe(true);
            });
        });

        describe('Inactive Flash Sale Scenarios', () => {
            it('should return Inactive status when flashStatus is false', async () => {
                // Arrange
                mockAppConfig.flashStatus = false;
                mockAppConfig.flashStart = '01/15/2024 10:00:00';
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should return Inactive status when current time is before start time', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 12:00:00'; // 1 hour after current time (11:00:00)
                mockAppConfig.flashEnd = '01/15/2024 15:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should return Inactive status when current time is after end time', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 09:00:00';
                mockAppConfig.flashEnd = '01/15/2024 10:00:00'; // 1 hour before current time (11:00:00)

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should return Inactive status when flashStatus is false even if time is valid', async () => {
                // Arrange
                mockAppConfig.flashStatus = false;
                mockAppConfig.flashStart = '01/15/2024 10:00:00';
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });
        });

        describe('Edge Cases and Error Scenarios', () => {
            it('should handle invalid date formats gracefully', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = 'invalid-date';
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should handle missing start date', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = undefined;
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should handle missing end date', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 10:00:00';
                mockAppConfig.flashEnd = undefined;

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should handle start time after end time', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 15:00:00'; // After end time
                mockAppConfig.flashEnd = '01/15/2024 10:00:00';   // Before start time

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Inactive);
                expect(result.isActive).toBe(false);
            });

            it('should handle different date formats', async () => {
                // Arrange
                mockAppConfig.flashStatus = true;
                mockAppConfig.flashStart = '01/15/2024 10:00:00';
                mockAppConfig.flashEnd = '01/15/2024 14:00:00';

                // Act
                const result = await flashSaleService.getStatus();

                // Assert
                expect(result).toEqual(ProgramStatus.Active);
            });
        });

        
    });

    describe('getCatalog', () => {
        it('should return the single flash product', async () => {
            // Arrange
            const expectedProduct = {
                id: "10001",
                name: "iPhone 16 Pro",
                price: 3100,
                stock: 1000,
                thumbnail: "https://www.apple.com/v/iphone-16-pro/f/images/overview/contrast/iphone_16_pro__erqf8e51gl4y_xlarge_2x.jpg",
            };
            mockSingleFlashProduct.id = expectedProduct.id;
            mockSingleFlashProduct.name = expectedProduct.name;
            mockSingleFlashProduct.price = expectedProduct.price;
            mockSingleFlashProduct.stock = expectedProduct.stock;
            mockSingleFlashProduct.thumbnail = expectedProduct.thumbnail;

            // Act
            const result = await flashSaleService.getCatalog();

            // Assert
            expect(result).toEqual(expectedProduct);
            expect(result.id).toBe("10001");
            expect(result.name).toBe("iPhone 16 Pro");
            expect(result.price).toBe(3100);
            expect(result.stock).toBe(1000);
            expect(result.thumbnail).toContain("apple.com");
        });

        it('should return product with all required properties', async () => {
            // Act
            const result = await flashSaleService.getCatalog();

            // Assert
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('stock');
            expect(result).toHaveProperty('thumbnail');
            expect(typeof result.id).toBe('string');
            expect(typeof result.name).toBe('string');
            expect(typeof result.price).toBe('number');
            expect(typeof result.stock).toBe('number');
            expect(typeof result.thumbnail).toBe('string');
        });

        it('should consistently return the same product', async () => {
            // Act
            const result1 = await flashSaleService.getCatalog();
            const result2 = await flashSaleService.getCatalog();

            // Assert
            expect(result1).toEqual(result2);
        });
    });

    describe('Static Properties', () => {
        it('should have correct FLASH_START_FORMAT', () => {
            // Assert
            expect(FlashSaleService.FLASH_START_FORMAT).toBe("MM/DD/YYYY hh:mm:ss");
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle rapid status checks', async () => {
            // Arrange
            mockAppConfig.flashStatus = true;
            mockAppConfig.flashStart = '01/15/2024 10:00:00';
            mockAppConfig.flashEnd = '01/15/2024 14:00:00';

            // Act - Multiple rapid calls
            const promises = Array(10).fill(null).map(() => flashSaleService.getStatus());
            const results = await Promise.all(promises);

            // Assert
            results.forEach(result => {
                expect(result).toEqual(ProgramStatus.Active);
            });
        });

        it('should handle concurrent catalog requests', async () => {
            // Act - Multiple concurrent calls
            const promises = Array(5).fill(null).map(() => flashSaleService.getCatalog());
            const results = await Promise.all(promises);

            // Assert
            results.forEach(result => {
                expect(result).toEqual(singleFlashProduct);
            });
        });
    });
});