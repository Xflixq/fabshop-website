import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSessionId = params.get("stripe_session_id");
    const nativeSessionId = params.get("native_session_id");

    if (!stripeSessionId) {
      setStatus("error");
      setErrorMsg("No payment session found.");
      return;
    }

    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

    fetch(`${basePath}/api/checkout/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeSessionId, nativeSessionId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to confirm order");
        }
        return res.json();
      })
      .then(({ orderId }) => {
        localStorage.setItem("weldforge_session_id", crypto.randomUUID());
        setStatus("success");
        setTimeout(() => setLocation(`/orders/${orderId}`), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message ?? "Something went wrong.");
      });
  }, [setLocation]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <h1 className="text-2xl font-black uppercase tracking-tight">Confirming payment...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment with Stripe.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-black uppercase tracking-tight">Payment confirmed!</h1>
              <p className="text-muted-foreground">Your order has been placed. Redirecting to your order details...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-black uppercase tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground">{errorMsg}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setLocation("/cart")}>
                  Back to cart
                </Button>
                <Button onClick={() => setLocation("/")}>
                  Go to store
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
