import { useState } from "react";
import { useGetInventory, getGetInventoryQueryKey, useGetProductLabel } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Search, Package, Tag } from "lucide-react";

function LabelPreview({ productId }: { productId: number }) {
  const { data: label, isLoading } = useGetProductLabel(productId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!label) return <div className="text-muted-foreground text-sm text-center p-4">No label data</div>;

  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-white text-gray-900 print:border-solid">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-bold font-mono text-xs text-primary uppercase tracking-widest mb-1">FABSHOP SUPPLY</div>
          <div className="font-bold text-lg leading-tight">{label.name}</div>
          <div className="font-mono text-xs text-gray-500 mt-1">SKU: {label.sku}</div>
          <div className="font-mono text-xs text-gray-500">Barcode: {label.barcode}</div>
        </div>
        {label.imageUrl && (
          <img
            src={label.imageUrl}
            alt={label.name}
            className="w-16 h-16 object-cover rounded shrink-0"
          />
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="font-bold text-2xl">£{Number(label.price).toFixed(0)}</div>
        <div className="text-xs font-mono border border-gray-300 px-2 py-1 rounded">
          {label.barcode}
        </div>
      </div>
    </div>
  );
}

export function Labels() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: inventory, isLoading } = useGetInventory({
    query: { queryKey: getGetInventoryQueryKey() }
  });

  const filtered = (inventory ?? []).filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Print Labels</h1>
          {selectedId && (
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {search ? "No products match" : "No products found"}
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {filtered.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          selectedId === item.id
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-muted rounded flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{item.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                        </div>
                        {selectedId === item.id && (
                          <Tag className="w-4 h-4 text-primary ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Label Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedId ? (
                  <div className="space-y-4">
                    <LabelPreview productId={selectedId} />
                    <Button onClick={handlePrint} className="w-full print:hidden" variant="outline">
                      <Printer className="w-4 h-4 mr-2" />
                      Print This Label
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <div className="text-sm">Select a product to preview its label</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
