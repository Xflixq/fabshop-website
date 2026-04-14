import { useEffect, useMemo, useState } from "react";
import { useGetInventory, getGetInventoryQueryKey, useAdjustStock } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Search, TrendingUp, TrendingDown, Plus, Star, Percent, Upload } from "lucide-react";

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  sku: "",
  stockQty: "",
  lowStockThreshold: "10",
  imageUrl: "",
  categoryId: "",
  specs: [] as Array<{ header: string; comment: string }>,
  weightKg: "1",
  featured: false,
};

export function Inventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [adjustItem, setAdjustItem] = useState<{ id: number; name: string; stockQty: number } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saleItem, setSaleItem] = useState<{ id: number; name: string; price: number } | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: inventory, isLoading } = useGetInventory({
    query: { queryKey: getGetInventoryQueryKey() }
  });
  const specRows = useMemo(() => productForm.specs, [productForm.specs]);


  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetch("/api/admin/categories", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch(() => undefined);
  }, []);

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
    adjustStock.mutate({ id: adjustItem.id, data: { adjustment: d, reason: reason || undefined } });
  };

  const updateProduct = async (id: number, data: Record<string, unknown>, successMessage: string) => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Update failed");
    queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
    toast({ title: successMessage });
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    try {
      await updateProduct(id, { featured }, featured ? "Product marked as featured" : "Product removed from featured");
    } catch {
      toast({ title: "Error", description: "Failed to update featured item", variant: "destructive" });
    }
  };

  const handleCreateProduct = async () => {
    setSavingProduct(true);
    try {
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : productForm.imageUrl || "";
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price),
          stockQty: Number(productForm.stockQty || 0),
          lowStockThreshold: Number(productForm.lowStockThreshold || 10),
          categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
          weightKg: Number(productForm.weightKg || 1),
          imageUrl: imageUrl || null,
          specs: JSON.stringify(productForm.specs.filter((row) => row.header || row.comment)),
        }),
      });
      if (!response.ok) throw new Error("Create failed");
      queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
      setCreateOpen(false);
      setProductForm(emptyProductForm);
      setImageFile(null);
      toast({ title: "Product created", description: "The new item is now in your catalogue" });
    } catch {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleApplySale = async () => {
    if (!saleItem) return;
    const price = Number(salePrice);
    if (!price || price <= 0) {
      toast({ title: "Invalid sale price", description: "Enter a sale price greater than zero", variant: "destructive" });
      return;
    }
    try {
      await updateProduct(saleItem.id, { price }, "Sale price applied");
      setSaleItem(null);
      setSalePrice("");
    } catch {
      toast({ title: "Error", description: "Failed to apply sale price", variant: "destructive" });
    }
  };

  const getStockBadge = (stockQty: number, threshold: number) => {
    if (stockQty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stockQty <= threshold) return <Badge variant="destructive" className="bg-orange-500">{stockQty} — Low</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-300">{stockQty} In Stock</Badge>;
  };

  const updateSpecCell = (index: number, key: "header" | "comment", value: string) => {
    const next = [...productForm.specs];
    next[index] = { ...next[index], [key]: value };
    setProductForm({ ...productForm, specs: next });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              {inventory ? `${inventory.length} products` : "Loading..."}
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New item
            </Button>
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
                        <div className="text-sm font-medium">£{Number(item.price).toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold}</div>
                      </div>
                      {getStockBadge(item.stockQty, item.lowStockThreshold)}
                      <Button
                        size="sm"
                        variant={item.featured ? "default" : "outline"}
                        onClick={() => handleToggleFeatured(item.id, !item.featured)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        {item.featured ? "Featured" : "Feature"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSaleItem({ id: item.id, name: item.name, price: item.price });
                          setSalePrice(String(item.price));
                        }}
                      >
                        <Percent className="w-4 h-4 mr-1" />
                        Sale
                      </Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create new item</DialogTitle>
            <DialogDescription>Add a product to the storefront catalogue.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sku">SKU</Label>
                <Input id="new-sku" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea id="new-description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-price">Price</Label>
                <Input id="new-price" type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-stock">Stock</Label>
                <Input id="new-stock" type="number" value={productForm.stockQty} onChange={(e) => setProductForm({ ...productForm, stockQty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-threshold">Low stock threshold</Label>
                <Input id="new-threshold" type="number" value={productForm.lowStockThreshold} onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-weight">Packed weight (kg)</Label>
              <Input id="new-weight" type="number" min="0.01" step="0.01" value={productForm.weightKg} onChange={(e) => setProductForm({ ...productForm, weightKg: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-image">Product image</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="new-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">The file will be uploaded from your browser and attached to the new product.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Specs table</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductForm({ ...productForm, specs: [...productForm.specs, { header: "", comment: "" }] })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add row
                </Button>
              </div>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="border-b px-3 py-2 text-left font-medium">Header</th>
                      <th className="border-b px-3 py-2 text-left font-medium">Comment</th>
                      <th className="border-b px-3 py-2 text-right font-medium w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                          Add headers and comments for your product specs.
                        </td>
                      </tr>
                    ) : (
                      specRows.map((row, index) => (
                        <tr key={index} className="align-top">
                          <td className="border-b px-3 py-2">
                            <Input value={row.header} onChange={(e) => updateSpecCell(index, "header", e.target.value)} placeholder="Material" />
                          </td>
                          <td className="border-b px-3 py-2">
                            <Textarea value={row.comment} onChange={(e) => updateSpecCell(index, "comment", e.target.value)} placeholder="Steel body" className="min-h-10" />
                          </td>
                          <td className="border-b px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setProductForm({ ...productForm, specs: productForm.specs.filter((_, i) => i !== index) })}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="new-featured" checked={productForm.featured} onCheckedChange={(checked) => setProductForm({ ...productForm, featured: checked === true })} />
              <Label htmlFor="new-featured">Mark as featured</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProduct} disabled={savingProduct}>
              {savingProduct ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!saleItem} onOpenChange={(open) => !open && setSaleItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale price — {saleItem?.name}</DialogTitle>
            <DialogDescription>Set the current selling price for this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              Current price: <span className="font-bold text-foreground">£{Number(saleItem?.price ?? 0).toFixed(0)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-price">Sale price</Label>
              <Input id="sale-price" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleItem(null)}>Cancel</Button>
            <Button onClick={handleApplySale}>Apply sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
