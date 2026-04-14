import { Link, useLocation } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import {
  ShoppingCart,
  Flame,
  Menu,
  LogIn,
  LogOut,
  User,
  MapPin,
  ShoppingBag,
  Settings,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuthContext";
import { useState, useRef } from "react";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  };

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-9 pl-9 pr-3 w-52 text-sm"
            autoFocus
            onBlur={() => {
              if (!query.trim()) setOpen(false);
            }}
          />
        </div>
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => { setQuery(""); setOpen(false); }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:flex h-9 w-9"
      onClick={() => setOpen(true)}
      aria-label="Search"
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}

function AuthSection() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return null;

  if (user) {
    const initials =
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      "U";

    const displayName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.email?.split("@")[0] || "Account";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hidden md:flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group">
            <span className="text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors max-w-[120px] truncate">
              {displayName}
            </span>
            <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
              <AvatarImage src={user.profileImage} alt={displayName} />
              <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
          <DropdownMenuLabel className="pb-1">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/profile?tab=orders" className="flex items-center gap-2 cursor-pointer">
              <ShoppingBag className="w-4 h-4" />
              My Orders
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/profile?tab=addresses" className="flex items-center gap-2 cursor-pointer">
              <MapPin className="w-4 h-4" />
              Saved Addresses
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="hidden md:flex items-center gap-1 text-sm uppercase tracking-wider font-bold"
    >
      <Link href="/sign-in">
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    </Button>
  );
}

export function Navbar() {
  const sessionId = getSessionId();
  const [mobileSearch, setMobileSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearch.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(mobileSearch.trim())}`);
      setMobileSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <form onSubmit={handleMobileSearch} className="flex gap-2 mb-2">
                  <Input
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Search products…"
                    className="h-10"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <Link href="/" className="text-lg font-bold">Home</Link>
                <Link href="/shop" className="text-lg font-bold">Shop All</Link>
                <Link href="/featured" className="text-lg font-bold">Featured</Link>
                <Link href="/support" className="text-lg font-bold">Support</Link>
                <Link href="/profile" className="text-lg font-bold">My Profile</Link>
                <Link href="/profile?tab=orders" className="text-lg font-bold">My Orders</Link>
                <Link href="/settings" className="text-lg font-bold">Settings</Link>
                <Link href="/cart" className="text-lg font-bold">Cart</Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-primary/90 transition-colors">
              <Flame className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block font-sans uppercase">
              FabShop
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 ml-4">
            <Link
              href="/shop"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Catalog
            </Link>
            <Link
              href="/featured"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Featured
            </Link>
            <Link
              href="/support"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Support
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar />
          <AuthSection />

          <Link href="/cart" className="relative group">
            <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-shadow hover:shadow-none active:shadow-none">
              <ShoppingCart className="h-5 w-5 shrink-0" />
              {itemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1.5 -right-1.5 min-h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full border-0 font-mono leading-none"
                >
                  <span className="translate-y-[0.5px]">{itemCount}</span>
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
