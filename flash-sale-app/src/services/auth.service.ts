import { fetchUtil } from '@/lib/fetchUtils';
import type { AuthResponse, LoginRequest } from '@/types/Type';
import { injectable } from 'tsyringe';
import type { IAuthService } from './interface';

@injectable()
class AuthService implements IAuthService {
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await fetchUtil.post<{data: AuthResponse}>('/api/auth/login', data);
        return response.data;
    }
}

export default AuthService;