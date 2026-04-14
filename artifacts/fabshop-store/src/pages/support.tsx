import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const faqs = [
  {
    q: "What are your shipping times?",
    a: "Most in-stock orders ship within 1–2 business days. Standard delivery takes 3–7 business days. Expedited and overnight options are available at checkout for time-sensitive orders.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes! All orders qualify for free standard shipping. No minimum order required.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns on unused items in original packaging within 30 days of delivery. Simply contact our support team to initiate a return and we'll provide a prepaid label.",
  },
  {
    q: "Are your products compatible with all welding machines?",
    a: "Product listings include compatibility details and specifications. If you're unsure whether a consumable or part fits your machine, contact us and our team will confirm before you order.",
  },
  {
    q: "Do you sell to businesses and contractors?",
    a: "Absolutely. We work with shops, contractors, and industrial operations of all sizes. Contact us about volume pricing and accounts.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order ships you'll receive a tracking number by email. You can also view your order status in the My Orders section of your profile.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely via Stripe. We do not store any card details.",
  },
  {
    q: "Can I change or cancel my order after placing it?",
    a: "Orders can be modified or cancelled within 1 hour of placement. After that, we begin processing for shipment. Contact support immediately if you need to make changes.",
  },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-zinc-950 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-black uppercase tracking-tight mb-4">
            How can we <span className="text-primary">help?</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Our team is standing by. Reach out and we'll get back to you fast.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14 max-w-6xl space-y-16">
        {/* Contact Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Email Us</h3>
              <p className="text-muted-foreground text-sm">For general inquiries and order questions</p>
              <a
                href="mailto:support@fabshop.com"
                className="text-primary font-semibold text-sm hover:underline block"
              >
                support@fabshop.com
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Call Us</h3>
              <p className="text-muted-foreground text-sm">Talk directly to our support team</p>
              <a
                href="tel:+18005551234"
                className="text-primary font-semibold text-sm hover:underline block"
              >
                1-800-555-1234
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8 pb-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Hours</h3>
              <p className="text-muted-foreground text-sm">When we're available</p>
              <div className="text-sm font-medium space-y-1">
                <p>Mon – Fri: 8 AM – 6 PM ET</p>
                <p className="text-muted-foreground">Sat – Sun: Closed</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Guarantees */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Our Guarantees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On every order, no minimum" },
              { icon: RotateCcw, title: "30-Day Returns", desc: "No questions asked on unused items" },
              { icon: ShieldCheck, title: "Secure Checkout", desc: "256-bit encryption via Stripe" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Contact Form */}
          <section>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Send a Message</h2>
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 bg-muted/30 rounded-xl border">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <h3 className="text-xl font-bold">Message received!</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Thanks for reaching out. We'll get back to you within 1 business day.
                </p>
                <Button variant="outline" onClick={() => setStatus("idle")}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Order question, product inquiry, etc."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail…"
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={status === "sending"}>
                  {status === "sending" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
