import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, LayoutTemplate, Code2 } from "lucide-react";

interface Banner {
  id: number;
  title: string;
  content: string;
  type: "html" | "template";
  template_name: string | null;
  active: boolean;
  position: "top" | "bottom" | "popup";
}

const TEMPLATES: Record<string, { label: string; html: string }> = {
  "free-shipping": {
    label: "Free Shipping Banner",
    html: `<div style="background:#f59e0b;color:#000;text-align:center;padding:10px 16px;font-weight:bold;font-size:14px;">🚚 Free delivery on orders over £50!</div>`,
  },
  "sale": {
    label: "Sale Banner",
    html: `<div style="background:#ef4444;color:#fff;text-align:center;padding:10px 16px;font-weight:bold;font-size:14px;">🔥 Sale on now — up to 30% off selected products!</div>`,
  },
  "newsletter": {
    label: "Newsletter Promo",
    html: `<div style="background:#3b82f6;color:#fff;text-align:center;padding:10px 16px;font-size:14px;">📧 Sign up to our newsletter for <strong>10% off</strong> your first order!</div>`,
  },
};

const emptyForm = {
  title: "",
  content: "",
  type: "template" as "html" | "template",
  templateName: "",
  position: "top" as "top" | "bottom" | "popup",
  active: true,
};

export function Banners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchBanners = () => {
    setLoading(true);
    fetch("/api/admin/banners", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBanners(data.map((b) => ({ ...b, active: Boolean(b.active) }))); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditBanner(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setForm({
      title: b.title,
      content: b.content,
      type: b.type,
      templateName: b.template_name ?? "",
      position: b.position,
      active: b.active,
    });
    setOpen(true);
  };

  const handleTemplateSelect = (key: string) => {
    const tpl = TEMPLATES[key];
    if (tpl) {
      setForm((f) => ({ ...f, templateName: key, content: tpl.html }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        type: form.type,
        templateName: form.templateName || null,
        position: form.position,
        active: form.active,
      };
      const url = editBanner ? `/api/admin/banners/${editBanner.id}` : "/api/admin/banners";
      const method = editBanner ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      fetchBanners();
      setOpen(false);
      toast({ title: editBanner ? "Banner updated" : "Banner created" });
    } catch {
      toast({ title: "Error saving banner", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE", credentials: "include" });
      fetchBanners();
      toast({ title: "Banner deleted" });
    } catch {
      toast({ title: "Error deleting banner", variant: "destructive" });
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await fetch(`/api/admin/banners/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: !b.active }),
      });
      fetchBanners();
    } catch {
      toast({ title: "Error toggling banner", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Banner
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Banners</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No banners yet — create one to display it on the storefront.</div>
            ) : (
              <div className="divide-y">
                {banners.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-6 py-4 gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{b.title}</span>
                        <Badge variant="outline" className="text-xs capitalize">{b.position}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {b.type === "html" ? <><Code2 className="w-3 h-3 mr-1 inline" />HTML</> : <><LayoutTemplate className="w-3 h-3 mr-1 inline" />Template</>}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1 font-mono">{b.content.replace(/<[^>]+>/g, "").slice(0, 80)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{b.active ? "Live" : "Hidden"}</span>
                        <Switch checked={b.active} onCheckedChange={() => handleToggleActive(b)} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Free Shipping Promo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as "html" | "template" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="html">Custom HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top of page</SelectItem>
                    <SelectItem value="bottom">Bottom of page</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === "template" && (
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={form.templateName} onValueChange={handleTemplateSelect}>
                  <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATES).map(([key, tpl]) => (
                      <SelectItem key={key} value={key}>{tpl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{form.type === "html" ? "HTML Content" : "Content (auto-filled from template)"}</Label>
              <Textarea
                rows={5}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={form.type === "html" ? "<div>Your HTML here...</div>" : "Select a template above or edit the content"}
                className="font-mono text-xs"
              />
            </div>

            {form.content && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: form.content }} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v })) } />
              <Label>Active (visible on storefront)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editBanner ? "Save Changes" : "Create Banner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
