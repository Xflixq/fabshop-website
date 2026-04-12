import { useState } from "react";
import { useListAdminOrders, getListAdminOrdersQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, ChevronDown, ChevronUp, Package } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export function Orders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders, isLoading } = useListAdminOrders({
    query: { queryKey: getListAdminOrdersQueryKey() }
  });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
        toast({ title: "Order updated", description: "Order status has been changed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
      }
    }
  });

  const filtered = (orders ?? []).filter(o =>
    statusFilter === "all" ? true : o.status === statusFilter
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
              {orders ? `${orders.length} total` : "..."}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {statusFilter !== "all" ? `No ${statusFilter} orders` : "No orders yet"}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.slice().reverse().map(order => (
                  <div key={order.id} className="p-0">
                    <div
                      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div>
                          <div className="font-mono text-sm font-semibold">ORD-{order.id.toString().padStart(4, "0")}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                        </div>
                        <div className="hidden sm:block min-w-0">
                          <div className="text-sm font-medium truncate">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground truncate">{order.customerEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="font-semibold text-sm">${(order.total / 100).toFixed(2)}</div>
                        <Select
                          value={order.status}
                          onValueChange={(val) => {
                            updateStatus.mutate({ id: order.id, data: { status: val as OrderStatus } });
                          }}
                          onOpenChange={(open) => open && setExpandedOrder(null)}
                        >
                          <SelectTrigger
                            className={`w-28 text-xs h-7 border ${STATUS_COLORS[order.status as OrderStatus] ?? ""}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="px-6 pb-4 bg-muted/20 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer</div>
                            <div className="text-sm">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ship To</div>
                            <div className="text-sm whitespace-pre-line">{order.shippingAddress}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</div>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                                <div className="flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{item.productName}</span>
                                  <span className="text-muted-foreground">×{item.quantity}</span>
                                </div>
                                <span className="font-medium">${(item.subtotal / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end pt-2 text-sm font-semibold">
                            Total: ${(order.total / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
