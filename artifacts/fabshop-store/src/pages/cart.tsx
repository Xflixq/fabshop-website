import { Link, useLocation } from "wouter";
import { 
  useGetCart, 
  useUpdateCartItem, 
  useRemoveCartItem,
  useListProducts,
  useAddToCart,
  getGetCartQueryKey,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionId, formatCurrency } from "@/lib/session";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, Zap } from "lucide-react";

export default function Cart() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const { data: quickAddProducts } = useListProducts(
    { featured: true, inStock: true },
    { query: { queryKey: getListProductsQueryKey({ featured: true, inStock: true }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const addToCart = useAddToCart();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    updateItem.mutate(
      { cartItemId: itemId, data: { quantity: newQuantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        }
      }
    );
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate(
      { cartItemId: itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        }
      }
    );
  };

  const handleQuickAdd = (productId: number) => {
    addToCart.mutate(
      { data: { sessionId, productId, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ featured: true, inStock: true }) });
        }
      }
    );
  };

  const isCartEmpty = !cart || cart.items.length === 0;

  return (
    <Layout>
      <div className="bg-zinc-950 text-white py-12 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-4">
            <ShoppingCart className="h-10 w-10 text-primary" /> Your Cart
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : isCartEmpty ? (
          <div className="text-center py-20 px-4 border-2 border-dashed rounded-lg bg-muted/20 max-w-2xl mx-auto">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-black uppercase tracking-wider mb-4">Your Tool Chest is Empty</h2>
            <p className="text-muted-foreground font-serif mb-8 text-lg">
              Looks like you haven't added any gear yet. Time to stock up for the next project.
            </p>
            <Button size="lg" asChild className="font-bold uppercase tracking-wider h-14 px-8">
              <Link href="/shop">Back to the Shop</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center">
                    {/* Mobile: Image + Title inline */}
                    <div className="col-span-6 flex gap-4 w-full">
                      <div className="w-20 h-20 bg-muted shrink-0 rounded border overflow-hidden flex items-center justify-center">
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground">NO IMG</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Link href={`/shop/${item.productId}`} className="font-bold text-lg leading-tight hover:text-primary transition-colors font-sans">
                          {item.productName}
                        </Link>
                        <div className="text-muted-foreground font-mono mt-1">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Quantity + Total inline */}
                    <div className="col-span-3 flex justify-center w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="flex items-center border-2 rounded-md">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateItem.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-10 text-center font-mono font-bold text-sm">
                          {item.quantity}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updateItem.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="col-span-2 text-left sm:text-right font-mono font-bold text-lg w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="sm:hidden text-muted-foreground text-sm mr-2 font-sans">Subtotal:</span>
                      {formatCurrency(item.subtotal)}
                    </div>

                    <div className="col-span-1 flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(item.id)}
                        disabled={removeItem.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 border-2 rounded-lg p-5 bg-muted/20">
                <h2 className="font-black uppercase tracking-wider text-lg mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Quick add before checkout
                </h2>
                {quickAddProducts && quickAddProducts.filter((product) => !cart.items.some((item) => item.productId === product.id)).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickAddProducts
                      .filter((product) => !cart.items.some((item) => item.productId === product.id))
                      .slice(0, 4)
                      .map((product) => (
                        <div key={product.id} className="flex items-center gap-3 rounded-md border bg-card p-3">
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                            ) : (
                              <Zap className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate">{product.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{formatCurrency(product.price)}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleQuickAdd(product.id)} disabled={addToCart.isPending}>
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground font-mono">
                    No quick add items are available right now. Go back to the shop to add more products.
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border-2 rounded-lg p-5 md:p-6 sticky top-24">
                <h2 className="font-black uppercase tracking-wider text-lg md:text-xl mb-4 pb-3 border-b">Order Summary</h2>
                
                <div className="space-y-3 mb-5 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-end mb-6">
                  <span className="font-bold uppercase tracking-wider text-sm">Estimated Total</span>
                  <span className="text-2xl md:text-3xl font-black font-mono text-primary leading-none">{formatCurrency(cart.total)}</span>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full font-bold uppercase tracking-wider h-14 text-lg"
                  onClick={() => setLocation("/checkout")}
                >
                  Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <div className="mt-4 text-center">
                  <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
