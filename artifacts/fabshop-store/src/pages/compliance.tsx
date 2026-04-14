import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pages: Record<string, { title: string; intro: string; sections: { title: string; body: string }[] }> = {
  "/privacy": {
    title: "Privacy & GDPR",
    intro: "How FabShop handles customer data, account rights, order records, and GDPR requests.",
    sections: [
      { title: "Data we collect", body: "We collect account details, saved addresses, cart activity, order history, and payment references needed to operate the shop. Card data is handled by Stripe and is not stored by FabShop." },
      { title: "How data is used", body: "Data is used to provide checkout, delivery, account access, fraud prevention, support, tax records, and service improvement." },
      { title: "Your GDPR rights", body: "Customers can access, export, correct, and request deletion of personal data. Account settings include controls for data export and account deletion." },
      { title: "Security", body: "Passwords are stored as bcrypt hashes, sessions use HTTP-only cookies, and payment details are redirected to Stripe Checkout." },
    ],
  },
  "/terms": {
    title: "Terms of Sale",
    intro: "Terms that apply when buying welding and fabrication supplies from FabShop.",
    sections: [
      { title: "Orders", body: "Orders are accepted when payment is completed and stock is available. We may contact you if an item becomes unavailable." },
      { title: "Pricing", body: "Prices are shown in GBP and include VAT unless clearly stated otherwise. Delivery costs are calculated at checkout." },
      { title: "Product use", body: "Customers must follow manufacturer guidance and safety standards for tools, consumables, PPE, and fabrication equipment." },
    ],
  },
  "/cookies": {
    title: "Cookie Policy",
    intro: "How essential cookies and local storage are used on FabShop.",
    sections: [
      { title: "Essential cookies", body: "We use essential session cookies to keep customers signed in and support secure checkout." },
      { title: "Cart storage", body: "A local cart session identifier keeps basket contents available while browsing." },
      { title: "Third parties", body: "Stripe may use cookies during secure payment checkout on its own payment pages." },
    ],
  },
  "/shipping": {
    title: "Shipping Policy",
    intro: "Delivery options available during checkout.",
    sections: [
      { title: "Royal Mail", body: "Tracked 48, Tracked 24, and Special Delivery options are offered where suitable for the parcel size." },
      { title: "DPD", body: "DPD tracked and next-day tracked services are available for faster delivery." },
      { title: "Free delivery", body: "Orders of £50 or more qualify for free shipping. The checkout banner shows the amount remaining before free shipping is unlocked." },
    ],
  },
  "/returns": {
    title: "Returns & Refunds",
    intro: "Returns guidance for eligible products.",
    sections: [
      { title: "Returns window", body: "Unused items can be returned within 30 days unless excluded for safety, custom, or hygiene reasons." },
      { title: "Condition", body: "Items should be returned in original packaging with accessories and documentation." },
      { title: "Refunds", body: "Refunds are made to the original payment method once returned items are inspected." },
    ],
  },
};

export default function CompliancePage() {
  const [path] = useLocation();
  const page = pages[path] ?? pages["/privacy"];

  return (
    <Layout>
      <div className="bg-zinc-950 text-white py-12 border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">{page.title}</h1>
          <p className="text-zinc-400 font-mono mt-3 max-w-2xl">{page.intro}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        {page.sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="uppercase tracking-wider text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-7">{section.body}</p>
            </CardContent>
          </Card>
        ))}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
          <h2 className="font-black uppercase tracking-wider mb-2">Need data help?</h2>
          <p className="text-muted-foreground mb-4">Signed-in customers can export account data or request deletion from settings.</p>
          <Button asChild>
            <Link href="/settings">Go to settings</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
