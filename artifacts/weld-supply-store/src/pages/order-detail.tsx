import { useParams, Link } from "wouter";
import { 
  useGetOrder,
  getGetOrderQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/session";
import { CheckCircle2, Package, Calendar, MapPin, Mail, User } from "lucide-react";

export default function OrderDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: order, isLoading, isError } = useGetOrder(id, {
    query: {
      enabled: !!id,
      queryKey: getGetOrderQueryKey(id)
    }
  });

  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-8">We couldn't locate this order.</p>
          <Button asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-8 text-center mb-12">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Order Confirmed</h1>
          <p className="text-muted-foreground font-serif text-lg">
            Thanks, {order.customerName.split(' ')[0]}. Your gear is being prepped.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Order Details */}
          <div className="bg-card border-2 rounded-lg p-6">
            <h2 className="font-bold uppercase tracking-wider mb-6 flex items-center border-b pb-4">
              <Package className="mr-2 h-5 w-5 text-primary" /> Order Info
            </h2>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground uppercase tracking-wider font-bold text-xs">Order ID</span>
                <span className="font-bold">#{order.id.toString().padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground uppercase tracking-wider font-bold text-xs">Status</span>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase text-xs">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground uppercase tracking-wider font-bold text-xs">Date</span>
                <span className="text-right">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-card border-2 rounded-lg p-6">
            <h2 className="font-bold uppercase tracking-wider mb-6 flex items-center border-b pb-4">
              <User className="mr-2 h-5 w-5 text-primary" /> Customer Info
            </h2>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{order.customerEmail}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{order.shippingAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border-2 rounded-lg p-6 md:p-8">
          <h2 className="font-bold uppercase tracking-wider mb-6 pb-4 border-b">Items Ordered</h2>
          
          <div className="space-y-6 mb-8">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-6 border-b last:border-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-lg leading-tight mb-1">{item.productName}</h4>
                  <div className="text-muted-foreground font-mono text-sm">
                    Qty: {item.quantity} &times; {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="font-mono font-bold text-lg">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-muted/30 p-6 rounded-md">
            <div className="flex justify-between items-end">
              <span className="font-bold uppercase tracking-wider text-lg">Total</span>
              <span className="text-3xl font-black font-mono text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="font-bold uppercase tracking-wider h-14 px-8">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
