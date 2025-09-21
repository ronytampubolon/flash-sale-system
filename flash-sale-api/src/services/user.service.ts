import jwt from 'jsonwebtoken';
import userModels, { IUserModel } from '../models/user.models';
import { IUserService } from './interface';
import { TokenResponse } from '../dtos/token';
import { injectable } from 'tsyringe';
import { UserDto } from '../dtos/user.dto';

@injectable()
class UserService implements IUserService {
    async generateToken(userData: UserDto): Promise<TokenResponse> {
        return {
            token: jwt.sign({ userData }, process.env.JWT_SECRET || 'secret', {
                expiresIn: '1h',
            }),
            expiredAt: new Date(Date.now() + 1000 * 60 * 60),
        };
    }
    async syncUserData(email: string): Promise<UserDto> {
        let userData = await userModels.findOne({ email });
        if (!userData) {
            userData = await userModels.create({ email });
        }
        return {
            id: userData._id as string,
            email: userData.email,
        };
    }
}

export default UserService;