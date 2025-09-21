import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { SignInDialog } from './signdialog';
import { User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

export function Header() {
  const { isAuthenticated, userEmail, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold">FlashSale</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Hello, {userEmail}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInDialog />
          )}
        </div>
      </div>
    </header>
  );
}