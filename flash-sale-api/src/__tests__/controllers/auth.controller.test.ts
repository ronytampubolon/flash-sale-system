import { Request, Response } from 'express';
import AuthController from '../../controllers/auth.controller';
import { IUserService } from '../../services/interface';
import { sendResponse } from '../../utils/response';
import { authUserSchema } from '../../controllers/schema';
import { TokenResponse } from '../../dtos/token';

// Mock dependencies
jest.mock('../../utils/response');
jest.mock('../../controllers/schema');

describe('AuthController', () => {
    let authController: AuthController;
    let mockUserService: jest.Mocked<IUserService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockSendResponse: jest.MockedFunction<typeof sendResponse>;
    let mockAuthUserSchema: jest.Mocked<typeof authUserSchema>;

    beforeEach(() => {
        // Mock UserService
        mockUserService = {
            syncUserData: jest.fn(),
            generateToken: jest.fn(),
        } as jest.Mocked<IUserService>;

        // Mock request and response
        mockRequest = {
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock utility functions
        mockSendResponse = sendResponse as jest.MockedFunction<typeof sendResponse>;
        mockAuthUserSchema = authUserSchema as jest.Mocked<typeof authUserSchema>;

        // Create controller instance
        authController = new AuthController(mockUserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        describe('successful login', () => {
            it('should login user successfully with valid email', async () => {
                // Arrange
                const email = 'test@example.com';
                const requestBody = { email };
                const userData = { id: 'user-123', email };
                const token: TokenResponse = {
                    token: 'jwt-token-123',
                    expiredAt: new Date()
                };

                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockReturnValue({ email });
                mockUserService.syncUserData.mockResolvedValue(userData);
                mockUserService.generateToken.mockResolvedValue(token);

                // Act
                await authController.login(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockAuthUserSchema.parse).toHaveBeenCalledWith(requestBody);
                expect(mockUserService.syncUserData).toHaveBeenCalledWith(email);
                expect(mockUserService.generateToken).toHaveBeenCalledWith(userData);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Login successful',
                    token
                );
            });

            it('should handle different email formats', async () => {
                // Arrange
                const email = 'user.name+tag@domain.co.uk';
                const requestBody = { email };
                const userData = { id: 'user-456', email };
                const token: TokenResponse = {
                    token: 'jwt-token-456',
                    expiredAt: new Date()
                };

                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockReturnValue({ email });
                mockUserService.syncUserData.mockResolvedValue(userData);
                mockUserService.generateToken.mockResolvedValue(token);

                // Act
                await authController.login(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockUserService.syncUserData).toHaveBeenCalledWith(email);
                expect(mockUserService.generateToken).toHaveBeenCalledWith(userData);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Login successful',
                    token
                );
            });
        });

        describe('validation errors', () => {
            it('should handle schema validation errors', async () => {
                // Arrange
                const requestBody = { email: 'invalid-email' };
                const validationError = new Error('Invalid email format');
                
                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(authController.login(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Invalid email format');

                expect(mockAuthUserSchema.parse).toHaveBeenCalledWith(requestBody);
                expect(mockUserService.syncUserData).not.toHaveBeenCalled();
                expect(mockUserService.generateToken).not.toHaveBeenCalled();
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle missing email in request body', async () => {
                // Arrange
                const requestBody = {};
                const validationError = new Error('Email is required');
                
                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(authController.login(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Email is required');

                expect(mockAuthUserSchema.parse).toHaveBeenCalledWith(requestBody);
                expect(mockUserService.syncUserData).not.toHaveBeenCalled();
            });
        });

        describe('service errors', () => {
            it('should handle user service syncUserData errors', async () => {
                // Arrange
                const email = 'test@example.com';
                const requestBody = { email };
                const serviceError = new Error('Database connection failed');

                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockReturnValue({ email });
                mockUserService.syncUserData.mockRejectedValue(serviceError);

                // Act & Assert
                await expect(authController.login(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Database connection failed');

                expect(mockUserService.syncUserData).toHaveBeenCalledWith(email);
                expect(mockUserService.generateToken).not.toHaveBeenCalled();
                expect(mockSendResponse).not.toHaveBeenCalled();
            });

            it('should handle token generation errors', async () => {
                // Arrange
                const email = 'test@example.com';
                const requestBody = { email };
                const userData = { id: 'user-123', email };
                const tokenError = new Error('JWT signing failed');

                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockReturnValue({ email });
                mockUserService.syncUserData.mockResolvedValue(userData);
                mockUserService.generateToken.mockRejectedValue(tokenError);

                // Act & Assert
                await expect(authController.login(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('JWT signing failed');

                expect(mockUserService.syncUserData).toHaveBeenCalledWith(email);
                expect(mockUserService.generateToken).toHaveBeenCalledWith(userData);
                expect(mockSendResponse).not.toHaveBeenCalled();
            });
        });

        describe('edge cases', () => {
            it('should handle empty request body', async () => {
                // Arrange
                const requestBody = {};
                const validationError = new Error('Request body is empty');
                
                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockImplementation(() => {
                    throw validationError;
                });

                // Act & Assert
                await expect(authController.login(mockRequest as Request, mockResponse as Response))
                    .rejects.toThrow('Request body is empty');
            });

            it('should handle null userData from service', async () => {
                // Arrange
                const email = 'test@example.com';
                const requestBody = { email };

                mockRequest.body = requestBody;
                mockAuthUserSchema.parse = jest.fn().mockReturnValue({ email });
                mockUserService.syncUserData.mockResolvedValue(null as any);
                mockUserService.generateToken.mockResolvedValue({
                    token: 'token',
                    expiredAt: new Date()
                });

                // Act
                await authController.login(mockRequest as Request, mockResponse as Response);

                // Assert
                expect(mockUserService.generateToken).toHaveBeenCalledWith(null);
                expect(mockSendResponse).toHaveBeenCalledWith(
                    mockResponse,
                    200,
                    'Login successful',
                    {
                        token: 'token',
                        expiredAt: expect.any(Date)
                    }
                );
            });
        });
    });
});