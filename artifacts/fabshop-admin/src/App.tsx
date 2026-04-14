import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dashboard } from "@/pages/dashboard";
import { Inventory } from "@/pages/inventory";
import { Orders } from "@/pages/orders";
import { Alerts } from "@/pages/alerts";
import { Labels } from "@/pages/labels";
import { Newsletter } from "@/pages/newsletter";
import { Banners } from "@/pages/banners";
import { AdminLogin } from "@/pages/AdminLogin";
import NotFound from "@/pages/not-found";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-mono animate-pulse">Verifying access...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/orders" component={Orders} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/labels" component={Labels} />
      <Route path="/newsletter" component={Newsletter} />
      <Route path="/banners" component={Banners} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
