import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LogIn } from 'lucide-react';
import { useAuthQueries } from '@/hooks/useAuthQueries';

export function SignInDialog() {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const { loginMutation: login } = useAuthQueries();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        await login.mutateAsync({
          email: email.trim(),
        });
        setEmail('');
        setOpen(false);
      } catch (error) {
        console.error('Sign in failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}