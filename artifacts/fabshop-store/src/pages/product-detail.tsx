import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetProduct, 
  useAddToCart, 
  getGetProductQueryKey,
  getGetCartQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getSessionId } from "@/lib/session";
import { 
  ShoppingCart, 
  ChevronLeft, 
  Minus, 
  Plus, 
  ShieldCheck, 
  Truck, 
  RotateCcw 
} from "lucide-react";

function parseSpecs(specs: string) {
  try {
    const parsed = JSON.parse(specs);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => ({
        label: key.replace(/[_-]/g, " "),
        value: Array.isArray(value) ? value.join(", ") : String(value),
      }));
    }
  } catch {
    return specs
      .split(/\n|,/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split(":");
        return { label: rest.length ? label.trim() : "Specification", value: rest.length ? rest.join(":").trim() : line };
      });
  }
  return [];
}

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProductQueryKey(id)
    }
  });

  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!product || product.stockQty <= 0) return;
    
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          toast({
            title: "Added to cart",
            description: `${quantity}x ${product.name} added to your cart.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not add item to cart.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleBuyNow = () => {
    if (!product || product.stockQty <= 0) return;
    
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          setLocation("/cart");
        }
      }
    );
  };

  const increment = () => {
    if (product && quantity < product.stockQty) {
      setQuantity(q => q + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-8">The item you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product?.stockQty === 0;

  return (
    <Layout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="link" asChild className="px-0 text-muted-foreground hover:text-foreground">
            <Link href="/shop">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Catalog
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading || !product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Images */}
            <div className="bg-muted/30 border-2 rounded-lg overflow-hidden flex items-center justify-center p-8 relative">
              {product.featured && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-mono uppercase tracking-wider">
                  Featured
                </Badge>
              )}
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-muted-foreground font-mono">
                  NO IMAGE
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                    {product.categoryName || "Uncategorized"}
                  </span>
                  <span className="text-muted-foreground">&bull;</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-4">
                  {product.name}
                </h1>
                <div className="flex items-end gap-4 mb-6">
                  <span className="text-3xl font-bold font-mono text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="mb-1 font-mono uppercase">Out of Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="mb-1 font-mono uppercase border-green-500/50 text-green-600 dark:text-green-400">
                      In Stock ({product.stockQty})
                    </Badge>
                  )}
                </div>
              </div>

              <div className="prose prose-zinc dark:prose-invert max-w-none font-serif text-lg text-muted-foreground mb-8">
                <p>{product.description}</p>
              </div>

              {/* Action Area */}
              <div className="bg-card border-2 p-6 rounded-lg mb-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex items-center border-2 rounded-md">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={decrement} 
                      disabled={quantity <= 1 || isOutOfStock}
                      className="rounded-none rounded-l-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-16 text-center font-mono font-bold">
                      {quantity}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={increment} 
                      disabled={quantity >= product.stockQty || isOutOfStock}
                      className="rounded-none rounded-r-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="flex-1 font-bold uppercase tracking-wider h-12"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || addToCart.isPending}
                  >
                    {addToCart.isPending ? "Adding..." : "Add to Cart"}
                    {!addToCart.isPending && <ShoppingCart className="ml-2 h-5 w-5" />}
                  </Button>
                </div>
                
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full font-bold uppercase tracking-wider h-12 border-2"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || addToCart.isPending}
                >
                  Buy It Now
                </Button>
              </div>

              {/* Specs */}
              {product.specs && (
                <div className="mb-8">
                  <Accordion type="single" collapsible defaultValue="specs" className="border rounded-lg bg-muted/20 px-4">
                    <AccordionItem value="specs" className="border-0">
                      <AccordionTrigger className="font-bold uppercase tracking-wider hover:no-underline">
                        Specifications
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="divide-y rounded-md border bg-background">
                          {parseSpecs(product.specs).map((spec, index) => (
                            <div key={`${spec.label}-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 text-sm">
                              <div className="font-bold capitalize">{spec.label}</div>
                              <div className="sm:col-span-2 text-muted-foreground font-mono">{spec.value}</div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-8 mt-auto">
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Trade Quality</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-8 w-8 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="h-8 w-8 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">30-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
