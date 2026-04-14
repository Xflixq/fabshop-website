import { useGetFeaturedProducts, getGetFeaturedProductsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, ArrowRight } from "lucide-react";

export default function FeaturedPage() {
  const { data: products, isLoading } = useGetFeaturedProducts({
    query: { queryKey: getGetFeaturedProductsQueryKey() },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-zinc-950 text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Hand-picked by our team
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Featured<br />
            <span className="text-primary">Products</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl">
            The best tools and consumables for serious fabricators. Tried, tested, and approved by professionals.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground text-sm">
                {products.length} featured {products.length === 1 ? "product" : "products"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-xl font-bold mb-2">No featured products yet</p>
            <p className="text-muted-foreground mb-6">Check back soon — we're curating something great.</p>
            <Button asChild>
              <Link href="/shop">
                Browse the full catalog <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* CTA Banner */}
      {products && products.length > 0 && (
        <section className="bg-primary/10 border-y border-primary/20 py-12 px-4 mt-8">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Need something specific?</h2>
            <p className="text-muted-foreground mb-6">
              Browse our full catalog of welding supplies, consumables, and fabrication tools.
            </p>
            <Button size="lg" asChild>
              <Link href="/shop">
                Shop All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </Layout>
  );
}
