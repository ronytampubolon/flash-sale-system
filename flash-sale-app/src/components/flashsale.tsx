import { useState } from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { SignInDialog } from './signdialog';
import { useAuth } from '@/context/useAuth';
import { ImageWithFallback } from '../lib/imagefallback';
import { Clock, Check } from 'lucide-react';
import type { FlashSaleProduct } from '@/types/Type';
import { useOrderQueries } from '@/hooks/useOrderQueries';
import { toast } from "sonner"

interface FlashSaleProductProps {
  product: FlashSaleProduct;
}

export function FlashSaleProduct({ product }: FlashSaleProductProps) {
  const { isAuthenticated } = useAuth();
  const { orderStatus, purchaseMutation: purchase , isLoading} = useOrderQueries();
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const handlePurchase = () => {
    if (!isAuthenticated) {
      setShowSignInDialog(true);
      return;
    }
    purchase.mutateAsync({
      productId: product.id,
    }).then((res) => {
      console.log(JSON.stringify(res))
      if (res.status === 'pending') {
        toast("Order is being proceed, please refresh to get final status.")
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <div className="relative">
          <ImageWithFallback
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur rounded-lg px-3 py-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-destructive" />
            <span className="text-sm font-medium text-destructive">Flash Sale</span>
          </div>
        </div>

        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-3">{product.name}</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-primary">
              ${product.price}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Limited time offer! Premium wireless headphones with active noise cancellation,
            30-hour battery life, and crystal-clear sound quality.
          </p>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          {orderStatus?.status === 'completed' ? (
            <Button className="w-full" disabled>
              <Check className="w-4 h-4 mr-2" />
              Purchased
            </Button>
          ) : (
            <Button
              disabled={isLoading}
              onClick={handlePurchase}
              className="w-full"
              size="lg"
            >
              Buy Now - ${product.price}
            </Button>
          )}
        </CardFooter>
      </Card>

      {showSignInDialog && !isAuthenticated && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to purchase this product.
              </p>
              <div className="flex gap-2">
                <SignInDialog />
                <Button
                  variant="outline"
                  onClick={() => setShowSignInDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}