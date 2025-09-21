import './App.css'
import { AuthProvider } from './context/auth.context';
import { Header } from './components/header';
import { FlashSaleProduct } from './components/flashsale';
import { useFlashSaleQueries } from './hooks/useFlashSaleQueries';
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  const { status, product, isLoading } = useFlashSaleQueries();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>{status?.isActive}</p>
          {status?.isActive ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">🔥 Flash Sale</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Don't miss out on this incredible deal! Limited time offer with massive savings.
                </p>
              </div>

              <div className="flex justify-center">
                {product && <FlashSaleProduct product={product} />}
              </div>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">🕒 Coming Soon</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our next flash sale is coming soon. Stay tuned for amazing deals!
              </p>
            </div>
          )}
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}
