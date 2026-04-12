import { useState } from "react";
import { useGetInventory, getGetInventoryQueryKey, useAdjustStock } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Search, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export function Inventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [adjustItem, setAdjustItem] = useState<{ id: number; name: string; stockQty: number } | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  const { data: inventory, isLoading } = useGetInventory({
    query: { queryKey: getGetInventoryQueryKey() }
  });

  const adjustStock = useAdjustStock({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
        toast({ title: "Stock updated", description: `Adjusted stock for ${adjustItem?.name}` });
        setAdjustItem(null);
        setDelta("");
        setReason("");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to adjust stock", variant: "destructive" });
      }
    }
  });

  const filtered = (inventory ?? []).filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjust = () => {
    if (!adjustItem) return;
    const d = parseInt(delta);
    if (isNaN(d)) {
      toast({ title: "Invalid delta", description: "Please enter a valid number", variant: "destructive" });
      return;
    }
    adjustStock.mutate({ id: adjustItem.id, data: { delta: d, reason: reason || undefined } });
  };

  const getStockBadge = (stockQty: number, threshold: number) => {
    if (stockQty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stockQty <= threshold) return <Badge variant="destructive" className="bg-orange-500">{stockQty} — Low</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">{stockQty} In Stock</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            {inventory ? `${inventory.length} products` : "Loading..."}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search ? "No products match your search" : "No products found"}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover shrink-0 bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                        {item.categoryName && (
                          <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium">${item.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold}</div>
                      </div>
                      {getStockBadge(item.stockQty, item.lowStockThreshold)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdjustItem({ id: item.id, name: item.name, stockQty: item.stockQty });
                          setDelta("");
                          setReason("");
                        }}
                      >
                        Adjust
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Current stock: <span className="font-bold text-foreground">{adjustItem?.stockQty}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delta">Quantity Change</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDelta(prev => String((parseInt(prev) || 0) - 1))}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Remove
                </Button>
                <Input
                  id="delta"
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="e.g. 10 or -5"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDelta(prev => String((parseInt(prev) || 0) + 1))}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use positive values to add stock, negative to remove.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Received shipment, Damaged goods..."
              />
            </div>
            {delta && !isNaN(parseInt(delta)) && (
              <div className="text-sm p-3 bg-muted rounded-md">
                New quantity will be:{" "}
                <span className="font-bold">
                  {Math.max(0, (adjustItem?.stockQty ?? 0) + parseInt(delta))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={adjustStock.isPending || !delta}>
              {adjustStock.isPending ? "Saving..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
