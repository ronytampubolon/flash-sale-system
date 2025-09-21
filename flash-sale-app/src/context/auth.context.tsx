import { createContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  signIn: (email: string, token: string) => void;
  isLoggedIn: () => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const TOKEN_KEY = 'auth_token';
const EMAIL_KEY = 'user_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const email = localStorage.getItem(EMAIL_KEY);
    if (token) {
      setIsAuthenticated(true);
    }
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const signIn = (email: string, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  const isLoggedIn = (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && isAuthenticated;
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, signIn, isLoggedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}