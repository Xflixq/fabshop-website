import { Link } from "wouter";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Flame className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight font-sans uppercase">
                FabShop
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm font-serif">
              Honest, heavy-duty fabrication and welding supplies for the garage workshop crowd.
              No fluff, just the right parts when you need them.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?featured=true" className="text-muted-foreground hover:text-foreground transition-colors">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                  View Cart
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-muted-foreground hover:text-foreground transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-muted-foreground hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Help & Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              <li><Link href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-foreground transition-colors">Returns</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy & GDPR</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-mono">
          <p>&copy; {new Date().getFullYear()} FabShop. All rights reserved.</p>
            <p>Built for the trade.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
