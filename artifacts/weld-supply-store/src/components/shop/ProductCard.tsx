import { Link } from "wouter";
import { type Product } from "@workspace/api-client-react";
import { formatCurrency, getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sessionId = getSessionId();
  const addToCart = useAddToCart();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    e.stopPropagation();
    
    if (product.stockQty <= 0) return;
    
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
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

  const isOutOfStock = product.stockQty <= 0;

  return (
    <Link href={`/shop/${product.id}`}>
      <Card 
        className="h-full flex flex-col group overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-lg cursor-pointer bg-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square bg-muted/30 overflow-hidden flex items-center justify-center p-6">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className={`object-contain w-full h-full transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground font-mono text-xs">
              NO IMAGE
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground font-mono rounded-sm shadow-sm uppercase tracking-wider text-[10px]">
                Featured
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="font-mono rounded-sm uppercase tracking-wider text-[10px]">
                Out of Stock
              </Badge>
            )}
          </div>
          
          <div className={`absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-background/90 to-transparent`}>
            <Button 
              className="w-full font-bold uppercase tracking-wider" 
              disabled={isOutOfStock || addToCart.isPending}
              onClick={handleAddToCart}
            >
              {addToCart.isPending ? "Adding..." : (isOutOfStock ? "Out of Stock" : "Add to Cart")}
              {!isOutOfStock && !addToCart.isPending && <ShoppingCart className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <CardContent className="flex-1 p-5 flex flex-col">
          <div className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">
            {product.categoryName || "Uncategorized"} &bull; SKU: {product.sku}
          </div>
          <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors font-sans">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-auto font-serif">
            {product.description}
          </p>
        </CardContent>
        
        <CardFooter className="p-5 pt-0 flex items-center justify-between mt-auto">
          <span className="font-mono font-bold text-xl">
            {formatCurrency(product.price)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
