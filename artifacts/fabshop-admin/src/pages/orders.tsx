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
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ShoppingCart, ChevronDown, ChevronUp, Package, Printer, FlaskConical } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: number;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

function ShippingLabelDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Shipping Label — Order #{order.id}</DialogTitle>
        </DialogHeader>

        <div className="border-2 border-dashed border-border rounded-lg p-5 bg-white text-gray-900 space-y-4 print:border-solid print:border-black print:rounded-none">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="font-black font-mono text-lg tracking-tight text-gray-900 uppercase">FABSHOP SUPPLY</div>
            <div className="font-mono text-xs text-gray-500">ORDER #{String(order.id).padStart(5, "0")}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</div>
              <div className="font-medium leading-snug">
                FabShop Supply Co.<br />
                456 Industry Blvd<br />
                Weld City, WC 00001
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ship To</div>
              <div className="font-medium leading-snug">
                <div className="font-bold">{order.customerName}</div>
                <div className="whitespace-pre-line text-xs">{order.shippingAddress}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contents</div>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 mt-2">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            <div className="font-mono text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
            <div className="font-mono text-xs border border-gray-300 px-2 py-1 rounded tracking-widest">
              FAB-{String(order.id).padStart(8, "0")}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const { isAuthenticated } = useAdminAuth();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

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

  const testOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/test-order", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create test order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
      toast({ title: "Test order created", description: "A test order has been added to the list." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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
          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testOrderMutation.mutate()}
                disabled={testOrderMutation.isPending}
                className="border-dashed"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                {testOrderMutation.isPending ? "Creating..." : "Create Test Order"}
              </Button>
            )}
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
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{statusFilter !== "all" ? `No ${statusFilter} orders` : "No orders yet"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.slice().reverse().map(order => (
                  <div key={order.id} className="transition-colors hover:bg-muted/30">
                    <div
                      className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">ORD-{order.id.toString().padStart(4, "0")}</span>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.status as OrderStatus] ?? ""}`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate mt-0.5">
                          {order.customerName} · {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">${Number(order.total).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setLabelOrder(order as unknown as Order)}
                          title="Print shipping label"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(val) =>
                            updateStatus.mutate({ id: order.id, data: { status: val as OrderStatus } })
                          }
                          onOpenChange={(open) => open && setExpandedOrder(null)}
                        >
                          <SelectTrigger
                            className={`w-28 text-xs h-7 border ${STATUS_COLORS[order.status as OrderStatus] ?? ""}`}
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
                                <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <div className="text-sm font-semibold">
                              Total: ${Number(order.total).toFixed(2)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLabelOrder(order as unknown as Order)}
                            >
                              <Printer className="w-3.5 h-3.5 mr-1.5" />
                              Print Shipping Label
                            </Button>
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

      {labelOrder && (
        <ShippingLabelDialog
          order={labelOrder}
          open={!!labelOrder}
          onClose={() => setLabelOrder(null)}
        />
      )}
    </AdminLayout>
  );
}
