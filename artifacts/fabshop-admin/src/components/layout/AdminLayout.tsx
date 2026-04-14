import { Link, useLocation } from "wouter";
import { LogOut, LayoutDashboard, Package, ShoppingCart, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function SignOutButton() {
  const { logout } = useAdminAuth();
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      onClick={async () => {
        await logout();
        window.location.href = "/";
      }}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Inventory", href: "/inventory" },
    { icon: ShoppingCart, label: "Orders", href: "/orders" },
    { icon: Bell, label: "Alerts", href: "/alerts" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      <div className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar">
          <div className="font-mono font-bold text-xl tracking-tight text-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs">F</span>
            </div>
            FABSHOP
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 tracking-wider mb-4 px-2">ADMIN CONTROLS</div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <SignOutButton />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
