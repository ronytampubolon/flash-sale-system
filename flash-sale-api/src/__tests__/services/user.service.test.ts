import 'reflect-metadata';
import UserService from '../../services/user.service';

// Mock jwt
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));

// Mock userModels
jest.mock('../../models/user.models', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

import jwt from 'jsonwebtoken';
import userModels from '../../models/user.models';
import { UserDto } from '../../dtos/user.dto';

const mockJwtSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>;
const mockFindOne = userModels.findOne as jest.MockedFunction<typeof userModels.findOne>;
const mockCreate = userModels.create as jest.MockedFunction<typeof userModels.create>;

describe('UserService', () => {
    let userService: UserService;
    
    beforeEach(() => {
        userService = new UserService();
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('should generate a token with correct payload and expiration', async () => {
            const userData: UserDto = { id: '123', email: 'test@example.com' };
            const mockToken = 'test.jwt.token';
            mockJwtSign.mockReturnValue(mockToken as any);
            const token = await userService.generateToken(userData);

            expect(mockJwtSign).toHaveBeenCalledWith(
                { userData },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            expect(token).toEqual({
                token: mockToken,
                expiredAt: expect.any(Date)
            });
        });
    });

    describe('syncUserData', () => {
        it('should sync user data with database', async () => {
            const userData: UserDto = { id: '123', email: 'test@example.com' };
            mockFindOne.mockResolvedValue(userData);
            const result = await userService.syncUserData(userData.email);
            expect(result.email).toEqual(userData.email);
            expect(mockFindOne).toHaveBeenCalledWith({ email: userData.email });
        });
    });
});