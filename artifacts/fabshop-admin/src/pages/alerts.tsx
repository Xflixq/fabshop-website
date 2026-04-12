import { useState } from "react";
import { useGetLowStockProducts, getGetLowStockProductsQueryKey, useSendLowStockAlert } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bell, CheckCircle, Mail, Package } from "lucide-react";

export function Alerts() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [alertResult, setAlertResult] = useState<{ sent: boolean; recipient: string; itemCount: number; message: string } | null>(null);

  const { data: lowStock, isLoading } = useGetLowStockProducts({
    query: { queryKey: getGetLowStockProductsQueryKey() }
  });

  const sendAlert = useSendLowStockAlert({
    mutation: {
      onSuccess: (data) => {
        setAlertResult(data);
        toast({ title: "Alert sent", description: data.message });
        setEmail("");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to send alert", variant: "destructive" });
      }
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendAlert.mutate({ data: { email: email.trim() } });
  };

  const urgentItems = (lowStock ?? []).filter(i => i.stockQty === 0);
  const lowItems = (lowStock ?? []).filter(i => i.stockQty > 0);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          {!isLoading && lowStock && lowStock.length > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} need attention
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
                </CardContent>
              </Card>
            ) : lowStock && lowStock.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <div className="font-semibold text-lg">Inventory Healthy</div>
                  <div className="text-muted-foreground text-sm mt-1">All products are well-stocked.</div>
                </CardContent>
              </Card>
            ) : (
              <>
                {urgentItems.length > 0 && (
                  <Card className="border-destructive/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Out of Stock ({urgentItems.length})
                      </CardTitle>
                      <CardDescription>These products cannot be purchased</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {urgentItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                            </div>
                            <Badge variant="destructive">0 units</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {lowItems.length > 0 && (
                  <Card className="border-orange-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-orange-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Low Stock ({lowItems.length})
                      </CardTitle>
                      <CardDescription>Stock at or below minimum threshold</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {lowItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                            </div>
                            <Badge className="bg-orange-500 text-white shrink-0">
                              {item.stockQty} / {item.lowStockThreshold} min
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Send Alert Email
                </CardTitle>
                <CardDescription>
                  Notify staff about low stock items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSend} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Recipient Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@example.com"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendAlert.isPending || !email.trim() || (lowStock?.length ?? 0) === 0}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendAlert.isPending ? "Sending..." : "Send Low Stock Alert"}
                  </Button>
                  {(lowStock?.length ?? 0) === 0 && !isLoading && (
                    <p className="text-xs text-muted-foreground text-center">
                      No low stock items to report
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {alertResult && (
              <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-400">Alert Sent</div>
                      <div className="text-xs text-green-700 dark:text-green-500 mt-1">{alertResult.message}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
