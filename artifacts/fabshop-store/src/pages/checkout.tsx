import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getSessionId, formatCurrency } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Truck, ArrowRight, Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email address"),
  shippingAddress: z.string().min(10, "Full shipping address is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const sessionId = getSessionId();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      shippingAddress: "",
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${basePath}/api/checkout/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, ...values }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message ?? "There was an issue starting your checkout. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-64 mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    setLocation("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-12 border-b-4 border-primary pb-4 inline-block">
          Secure Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-card border-2 rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                <Truck className="mr-3 h-6 w-6 text-primary" /> Shipping Details
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="h-12 font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              type="email"
                              className="h-12 font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">
                          Complete Shipping Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Workshop Ln, Industrial Park, CA 90210"
                            className="h-12 font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6 border-t">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 text-lg font-bold uppercase tracking-wider"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Redirecting to payment…
                        </>
                      ) : (
                        <>
                          Pay with Stripe
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground font-mono mt-4 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 mr-1 text-primary" /> Secure payment powered by Stripe
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-zinc-950 text-white rounded-lg p-6 md:p-8 sticky top-24 border border-zinc-800">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Order Summary</h2>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-white/10 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      {item.productImageUrl ? (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[8px] font-mono text-white/50">IMG</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.productName}</h4>
                      <div className="text-zinc-400 font-mono text-xs mt-1">
                        Qty: {item.quantity} &times; {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm shrink-0 text-primary">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-zinc-800 my-6" />

              <div className="space-y-3 text-sm font-mono text-zinc-400 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">{formatCurrency(cart.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-zinc-800 pt-6">
                <span className="font-bold uppercase tracking-wider">Total</span>
                <span className="text-3xl font-black font-mono text-primary">
                  {formatCurrency(cart.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
