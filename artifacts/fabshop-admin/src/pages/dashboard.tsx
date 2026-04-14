import { useGetAdminDashboard, getGetAdminDashboardQueryKey, useListAdminOrders, getListAdminOrdersQueryKey, useGetLowStockProducts, getGetLowStockProductsQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ShoppingCart, DollarSign, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { data: dashboard, isLoading: dashLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  const { data: orders, isLoading: ordersLoading } = useListAdminOrders({
    query: { queryKey: getListAdminOrdersQueryKey() }
  });

  const { data: lowStock, isLoading: stockLoading } = useGetLowStockProducts({
    query: { queryKey: getGetLowStockProductsQueryKey() }
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        </div>

        {dashLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : dashboard ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{Number(dashboard.totalRevenue).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.totalProducts}</div>
              </CardContent>
            </Card>
            <Card className={dashboard.lowStockCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${dashboard.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.lowStockCount}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/orders" className="text-sm text-primary flex items-center hover:underline">
                View all <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-md bg-card">
                      <div>
                        <div className="font-mono text-sm">ORD-{order.id.toString().padStart(4, '0')}</div>
                        <div className="text-sm text-muted-foreground">{order.customerName}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-medium">£{Number(order.total).toFixed(2)}</div>
                        <Badge variant={order.status === 'delivered' ? 'outline' : order.status === 'pending' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No recent orders</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock</CardTitle>
              <Link href="/alerts" className="text-sm text-primary flex items-center hover:underline">
                Alerts <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : lowStock && lowStock.length > 0 ? (
                <div className="space-y-4">
                  {lowStock.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium text-sm truncate max-w-[150px]">{item.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                      </div>
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {item.stockQty} left
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Inventory is healthy</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
