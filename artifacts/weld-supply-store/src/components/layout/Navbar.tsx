import { Link } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { ShoppingCart, Flame, Menu, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuthContext";

function AuthSection() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return (
      <>
        <span className="hidden md:inline text-sm text-muted-foreground font-medium">
          {user.firstName || user.email?.split("@")[0] || "Account"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-1 text-sm uppercase tracking-wider font-bold"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </>
    );
  }

  return (
    <Button variant="ghost" size="sm" asChild className="hidden md:flex items-center gap-1 text-sm uppercase tracking-wider font-bold">
      <Link href="/sign-in">
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    </Button>
  );
}

export function Navbar() {
  const sessionId = getSessionId();
  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-bold">Home</Link>
                <Link href="/shop" className="text-lg font-bold">Shop All</Link>
                <Link href="/cart" className="text-lg font-bold">Cart</Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-primary/90 transition-colors">
              <Flame className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block font-sans uppercase">
              FabShop
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link href="/shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              Catalog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <AuthSection />

          <Link href="/cart" className="relative group">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background font-mono"
                >
                  {itemCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
