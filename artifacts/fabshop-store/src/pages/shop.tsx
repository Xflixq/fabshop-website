import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { 
  useListProducts, 
  useGetCategoryCounts,
  getListProductsQueryKey,
  getGetCategoryCountsQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

export default function Shop() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const [, setLocation] = useLocation();
  
  // Parse params
  const paramCategoryId = searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined;
  const paramSearch = searchParams.get("search") || undefined;
  const paramInStock = searchParams.get("inStock") === "true";
  const paramFeatured = searchParams.get("featured") === "true";

  // Local state for UI inputs before applying
  const [searchTerm, setSearchTerm] = useState(paramSearch || "");

  // Update URL function
  const updateFilters = (updates: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchString);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === false || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    setLocation(`/shop?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const { data: products, isLoading: isLoadingProducts } = useListProducts(
    { 
      categoryId: paramCategoryId, 
      search: paramSearch, 
      inStock: paramInStock ? true : undefined,
      featured: paramFeatured ? true : undefined
    },
    { query: { queryKey: getListProductsQueryKey({ 
      categoryId: paramCategoryId, 
      search: paramSearch, 
      inStock: paramInStock ? true : undefined,
      featured: paramFeatured ? true : undefined
    }) } }
  );

  const { data: categoryCounts } = useGetCategoryCounts({
    query: { queryKey: getGetCategoryCountsQueryKey() }
  });

  const clearFilters = () => {
    setSearchTerm("");
    setLocation("/shop");
  };

  const hasFilters = paramCategoryId !== undefined || paramSearch !== undefined || paramInStock || paramFeatured;

  const SidebarContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold uppercase tracking-wider mb-4 text-sm border-b pb-2">Search</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Part name, SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-mono"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div>
        <h3 className="font-bold uppercase tracking-wider mb-4 text-sm border-b pb-2">Categories</h3>
        <div className="space-y-2">
          <button 
            onClick={() => updateFilters({ categoryId: undefined })}
            className={`block w-full text-left font-mono text-sm py-1.5 px-2 rounded-sm transition-colors ${paramCategoryId === undefined ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
          >
            All Categories
          </button>
          {categoryCounts?.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => updateFilters({ categoryId: cat.categoryId })}
              className={`flex items-center justify-between w-full text-left font-mono text-sm py-1.5 px-2 rounded-sm transition-colors ${paramCategoryId === cat.categoryId ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <span>{cat.categoryName}</span>
              <span className="opacity-50 text-xs">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold uppercase tracking-wider mb-4 text-sm border-b pb-2">Availability</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inStock" 
              checked={paramInStock}
              onCheckedChange={(checked) => updateFilters({ inStock: checked as boolean })}
            />
            <Label htmlFor="inStock" className="font-mono cursor-pointer">In Stock Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="featured" 
              checked={paramFeatured}
              onCheckedChange={(checked) => updateFilters({ featured: checked as boolean })}
            />
            <Label htmlFor="featured" className="font-mono cursor-pointer">Featured Items</Label>
          </div>
        </div>
      </div>

      {hasFilters && (
        <Button variant="outline" className="w-full font-mono uppercase tracking-wider text-xs" onClick={clearFilters}>
          <X className="h-3 w-3 mr-2" /> Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="bg-zinc-950 text-white py-12 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            {paramFeatured ? "Featured Gear" : 
             paramCategoryId ? categoryCounts?.find(c => c.categoryId === paramCategoryId)?.categoryName || "Category" : 
             "Complete Catalog"}
          </h1>
          <p className="text-zinc-400 font-mono mt-2 uppercase tracking-widest text-sm">
            {products?.length || 0} items available
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-24">
            <SidebarContent />
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="md:hidden w-full flex justify-between items-center mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="font-mono uppercase">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                  {hasFilters && <span className="ml-2 bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center text-[10px]">!</span>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-black uppercase tracking-wider text-left border-b pb-4 mb-6">Filters</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div className="text-sm font-mono text-muted-foreground">
              Showing {products?.length || 0} results
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <Skeleton className="w-full aspect-square rounded-md" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/4 mt-auto" />
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="text-center py-20 px-4 border-2 border-dashed rounded-lg bg-muted/20">
                <h3 className="text-xl font-bold uppercase mb-2">No Parts Found</h3>
                <p className="text-muted-foreground font-serif mb-6">We couldn't find any items matching your current filters.</p>
                <Button onClick={clearFilters} variant="outline" className="font-bold uppercase tracking-wider">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
