import { Link } from "wouter";
import { 
  useGetFeaturedProducts, 
  useGetCatalogSummary,
  useListCategories,
  getGetFeaturedProductsQueryKey,
  getGetCatalogSummaryQueryKey,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Target, Zap, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useGetFeaturedProducts({
    query: { queryKey: getGetFeaturedProductsQueryKey() }
  });
  
  const { data: summary } = useGetCatalogSummary({
    query: { queryKey: getGetCatalogSummaryQueryKey() }
  });
  
  const { data: categories, isLoading: isLoadingCategories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-transparent z-10" />
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 lg:py-48 relative z-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-mono uppercase tracking-wider mb-6">
              <Zap className="h-4 w-4" /> Professional Grade
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-sans uppercase tracking-tight leading-[1.1] mb-6">
              Heavy-Duty Parts.<br />
              <span className="text-primary">No Bullshit.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-serif mb-10 max-w-2xl">
              We stock the exact hardware, filler metal, and fabrication supplies you need. Build the roll cage, finish the bracket, get it done right.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg h-14 px-8 uppercase tracking-wider font-bold">
                <Link href="/shop">Shop the Catalog</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg h-14 px-8 uppercase tracking-wider font-bold bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white">
                <Link href="/shop?featured=true">View Featured</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm relative z-20">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800">
              <div className="text-center px-4">
                <div className="font-mono text-3xl font-bold text-primary mb-1">{summary?.totalProducts || "..."}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Parts in Stock</div>
              </div>
              <div className="text-center px-4">
                <div className="font-mono text-3xl font-bold text-primary mb-1">24h</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Fulfillment</div>
              </div>
              <div className="text-center px-4">
                <div className="font-mono text-3xl font-bold text-primary mb-1"><ShieldCheck className="h-8 w-8 mx-auto" /></div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Trade Quality</div>
              </div>
              <div className="text-center px-4">
                <div className="font-mono text-3xl font-bold text-primary mb-1"><Target className="h-8 w-8 mx-auto" /></div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Exact Specs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Featured Gear</h2>
              <p className="text-muted-foreground font-serif max-w-2xl">Hand-picked supplies tested in real shops. If it's here, we trust it.</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex font-bold uppercase tracking-wider">
              <Link href="/shop?featured=true">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingFeatured ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="w-full aspect-square rounded-md" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/4 mt-auto" />
                </div>
              ))
            ) : featuredProducts?.length ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-muted/30 border border-dashed rounded-lg">
                <p className="text-muted-foreground font-mono">No featured products available.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 md:hidden">
            <Button variant="outline" className="w-full font-bold uppercase tracking-wider" asChild>
              <Link href="/shop?featured=true">View All Featured</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Shop by Category</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground font-serif">Find exactly what you need to finish the job.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingCategories ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-none" />
              ))
            ) : categories?.length ? (
              categories.map((category) => (
                <Link key={category.id} href={`/shop?categoryId=${category.id}`}>
                  <div className="group relative h-64 overflow-hidden bg-zinc-900 cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-800">
                        <Box className="h-32 w-32 opacity-20" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h3 className="text-2xl font-bold text-white uppercase tracking-wider mb-1">{category.name}</h3>
                          <p className="text-zinc-400 font-mono text-sm">{category.productCount} items</p>
                        </div>
                        <div className="bg-primary text-primary-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No categories found.
              </div>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Button size="lg" className="font-bold uppercase tracking-wider px-8" asChild>
              <Link href="/shop">Browse Entire Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
