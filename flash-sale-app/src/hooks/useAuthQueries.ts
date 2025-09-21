import { useMutation } from '@tanstack/react-query';
import type { LoginRequest, AuthResponse, ApiError } from '@/types/Type';
import AuthService from '@/services/auth.service';
import { useAuth } from '@/context/useAuth';
import { container } from '@/config/container';


export const useAuthQueries = () => {
  const authService = container.resolve(AuthService);
  const { signIn } = useAuth();
  const loginMutation = useMutation<AuthResponse, ApiError, LoginRequest>({
    mutationFn: async (data: LoginRequest) => {
      const response = await authService.login(data);
      // save session 
      signIn(data.email, response.token);
      return response;
    },
    onError: (error: ApiError) => {
      console.error('Login failed:', error.message);
    },
  });

  return {
    loginMutation,
  };
};