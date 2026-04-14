import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
import { ShieldCheck, Truck, ArrowRight, Loader2, MapPin, Sparkles, PackagePlus } from "lucide-react";

type ShippingOption = {
  id: string;
  carrier: string;
  label: string;
  eta: string;
  price: number;
  freeEligible: boolean;
};

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email address"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "Town or city is required"),
  state: z.string().min(2, "County is required"),
  zipCode: z.string().min(3, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  shippingMethod: z.string().min(1, "Choose a delivery method"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

type Address = {
  id: number;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault: boolean;
};

export default function Checkout() {
  const sessionId = getSessionId();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [packageWeightKg, setPackageWeightKg] = useState(0);

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United Kingdom",
      shippingMethod: "",
    },
  });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user?.email) {
          form.setValue("customerEmail", user.email);
          form.setValue("customerName", [user.firstName, user.lastName].filter(Boolean).join(" "));
        }
      })
      .catch(() => undefined);

    fetch("/api/addresses", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAddresses(data);
          const defaultAddress = data.find((address) => address.isDefault) ?? data[0];
          if (defaultAddress) selectAddress(defaultAddress);
        }
      })
      .catch(() => undefined);
  }, []);

  const watchedAddress = form.watch(["street", "city", "state", "zipCode", "country"]);
  const selectedShippingId = form.watch("shippingMethod");
  const addressComplete = watchedAddress.every((value) => value.trim().length > 0);
  const selectedShipping = shippingOptions.find((option) => option.id === selectedShippingId);
  const itemTotal = cart?.total ?? 0;
  const freeShippingRemaining = Math.max(0, 50 - itemTotal);
  const shippingCost = selectedShipping?.price ?? 0;
  const orderTotal = itemTotal + shippingCost;
  const vatIncluded = orderTotal - orderTotal / 1.2;

  const selectedAddressText = useMemo(() => {
    const [street, city, state, zipCode, country] = watchedAddress;
    return [street, city, state, zipCode, country].filter(Boolean).join(", ");
  }, [watchedAddress]);

  const selectAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    form.setValue("customerName", address.fullName);
    form.setValue("street", address.street);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("zipCode", address.zipCode);
    form.setValue("country", address.country || "United Kingdom");
  };

  useEffect(() => {
    if (!addressComplete || !cart || cart.items.length === 0) {
      setShippingOptions([]);
      setPackageWeightKg(0);
      form.setValue("shippingMethod", "");
      return;
    }

    const controller = new AbortController();
    setShippingLoading(true);
    fetch("/api/checkout/shipping-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to calculate delivery");
        }
        return res.json();
      })
      .then((quote) => {
        const options = Array.isArray(quote.options) ? quote.options : [];
        setShippingOptions(options);
        setPackageWeightKg(Number(quote.packageWeightKg ?? 0));
        if (!options.some((option: ShippingOption) => option.id === form.getValues("shippingMethod"))) {
          form.setValue("shippingMethod", "");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setShippingOptions([]);
        toast({ title: "Delivery unavailable", description: err.message, variant: "destructive" });
      })
      .finally(() => setShippingLoading(false));

    return () => controller.abort();
  }, [addressComplete, cart?.itemCount, cart?.total, sessionId]);

  const chooseNewAddress = () => {
    setSelectedAddressId("new");
    form.setValue("street", "");
    form.setValue("city", "");
    form.setValue("state", "");
    form.setValue("zipCode", "");
    form.setValue("country", "United Kingdom");
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    try {
      const shippingAddress = `${values.street}\n${values.city}, ${values.state}\n${values.zipCode}\n${values.country}`;
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          shippingAddress,
          address: {
            fullName: values.customerName,
            street: values.street,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            country: values.country,
          },
          shippingMethod: selectedShipping?.id,
          vatIncluded,
        }),
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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight border-b-4 border-primary pb-4 inline-block">
              Secure Checkout
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-3">Choose an address, collect delivery options, then pay securely by card.</p>
          </div>
          <div className="rounded-full bg-zinc-950 text-white px-5 py-3 font-mono text-sm border border-primary/40">
            {freeShippingRemaining > 0 ? `${formatCurrency(freeShippingRemaining)} until free Royal Mail Tracked 48` : "Free Royal Mail Tracked 48 unlocked"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-card border-2 rounded-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                <MapPin className="mr-3 h-6 w-6 text-primary" /> Delivery Address
              </h2>

              {addresses.length > 0 && (
                <div className="grid gap-3 mb-6">
                  {addresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => selectAddress(address)}
                      className={`text-left rounded-lg border-2 p-4 transition ${selectedAddressId === address.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">{address.fullName}</span>
                        {address.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {address.street}, {address.city}, {address.state}, {address.zipCode}
                      </p>
                    </button>
                  ))}
                  <Button type="button" variant="outline" onClick={chooseNewAddress} className="justify-start">
                    <PackagePlus className="h-4 w-4 mr-2" /> Use a new address
                  </Button>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Full Name</FormLabel>
                        <FormControl><Input placeholder="John Smith" className="h-12 font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Email Address</FormLabel>
                        <FormControl><Input placeholder="john@example.co.uk" type="email" className="h-12 font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Street Address</FormLabel>
                      <FormControl><Input placeholder="Unit 4, Foundry Road" className="h-12 font-mono" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Town / City</FormLabel>
                        <FormControl><Input className="h-12 font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">County</FormLabel>
                        <FormControl><Input className="h-12 font-mono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Postcode</FormLabel>
                        <FormControl><Input className="h-12 font-mono uppercase" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs tracking-wider text-muted-foreground">Country</FormLabel>
                      <FormControl><Input className="h-12 font-mono" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className={`rounded-lg border-2 p-5 transition ${addressComplete ? "border-primary/60 bg-primary/5" : "border-dashed bg-muted/40 text-muted-foreground"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`h-9 w-9 rounded-full flex items-center justify-center ${addressComplete ? "bg-primary text-primary-foreground compliance-shine" : "bg-muted text-muted-foreground"}`}>
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="font-black uppercase tracking-wider">Delivery Method</h3>
                        <p className="text-xs font-mono">{addressComplete ? `${selectedAddressText}${packageWeightKg ? ` · ${packageWeightKg.toFixed(2)} kg packed` : ""}` : "Enter or select an address to collect tracked delivery options"}</p>
                      </div>
                    </div>

                    <FormField control={form.control} name="shippingMethod" render={({ field }) => (
                      <FormItem>
                        <div className="grid gap-3">
                          {shippingLoading && (
                            <div className="rounded-lg border-2 border-dashed p-4 text-sm font-mono text-muted-foreground">
                              Calculating delivery from basket weight…
                            </div>
                          )}
                          {!shippingLoading && shippingOptions.map((option) => {
                            const selected = field.value === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={!addressComplete}
                                onClick={() => field.onChange(option.id)}
                                className={`text-left rounded-lg border-2 p-4 transition disabled:opacity-45 disabled:cursor-not-allowed ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <div className="font-bold">{option.carrier} {option.label}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{option.eta}</div>
                                  </div>
                                  <div className="text-right font-mono font-bold text-primary">
                                    {option.price === 0 ? "Free" : formatCurrency(option.price)}
                                    {option.freeEligible && itemTotal >= 50 && <div className="text-[10px] text-muted-foreground">£50+ promo</div>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-6 border-t">
                    <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold uppercase tracking-wider" disabled={isSubmitting || shippingLoading || !selectedShipping}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Redirecting to payment…</> : <>Pay with Stripe<ArrowRight className="ml-2 h-5 w-5" /></>}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground font-mono mt-4 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 mr-1 text-primary" /> Secure payment powered by Stripe
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-zinc-950 text-white rounded-lg p-6 md:p-8 sticky top-24 border border-zinc-800">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6">Receipt</h2>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-white/10 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      {item.productImageUrl ? <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-contain" /> : <span className="text-[8px] font-mono text-white/50">IMG</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.productName}</h4>
                      <div className="text-zinc-400 font-mono text-xs mt-1">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                    </div>
                    <div className="font-mono font-bold text-sm shrink-0 text-primary">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>

              <Separator className="bg-zinc-800 my-6" />

              <div className="space-y-3 text-sm font-mono text-zinc-400 mb-6">
                <div className="flex justify-between"><span>Items subtotal</span><span className="text-white">{formatCurrency(itemTotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className="text-white">{selectedShipping ? (shippingCost === 0 ? "Free" : formatCurrency(shippingCost)) : "Choose option"}</span></div>
                {packageWeightKg > 0 && <div className="flex justify-between"><span>Packed weight</span><span className="text-white">{packageWeightKg.toFixed(2)} kg</span></div>}
                <div className="flex justify-between"><span>VAT included</span><span className="text-white">{formatCurrency(vatIncluded)}</span></div>
                {selectedShipping && <div className="flex justify-between"><span>Method</span><span className="text-white text-right">{selectedShipping.carrier}<br />{selectedShipping.label}</span></div>}
              </div>

              <div className="flex justify-between items-end border-t border-zinc-800 pt-6">
                <span className="font-bold uppercase tracking-wider">Total</span>
                <span className="text-3xl font-black font-mono text-primary">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
