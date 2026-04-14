import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Send, CheckCircle2 } from "lucide-react";

interface Subscriber {
  id: number;
  email: string;
  verified: boolean;
  discount_code: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export function Newsletter() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchSubscribers = () => {
    setLoading(true);
    fetch("/api/admin/newsletter/subscribers", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubscribers(data); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const activeSubscribers = subscribers.filter((s) => !s.unsubscribed_at);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Fill in subject and body", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Campaign sent", description: data.message });
        setSubject("");
        setBody("");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {activeSubscribers.length} active subscriber{activeSubscribers.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-md text-sm text-muted-foreground border">
                This will send to <span className="font-bold text-foreground">{activeSubscribers.length}</span> active subscriber{activeSubscribers.length !== 1 ? "s" : ""}.
                Connect an SMTP service (e.g. SendGrid, Resend) to enable real email delivery.
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Your subject line..." value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" placeholder="Write your email content here..." rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <Button onClick={handleSend} disabled={sending || activeSubscribers.length === 0} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : `Send to ${activeSubscribers.length} subscriber${activeSubscribers.length !== 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No subscribers yet</div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {subscribers.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.email}</div>
                        {s.discount_code && (
                          <div className="text-xs font-mono text-muted-foreground">Code: {s.discount_code}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {s.unsubscribed_at ? (
                          <Badge variant="outline" className="text-muted-foreground">Unsubscribed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
