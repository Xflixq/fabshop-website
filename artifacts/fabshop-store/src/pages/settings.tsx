import { useAuth } from "@/hooks/useAuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/layout/Navbar";
import { Download, Loader2, Save, ShieldAlert, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, refresh } = useAuth();
  const [_location, setLocation] = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/sign-in");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName }),
      });
      if (response.ok) {
        await refresh();
        setSaveMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        const data = await response.json();
        setSaveMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/auth/privacy/export", { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "fabshop-gdpr-export.json";
      link.click();
      URL.revokeObjectURL(url);
      setSaveMessage({ type: "success", text: "Your account data export has downloaded" });
    } catch {
      setSaveMessage({ type: "error", text: "Could not export your account data" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm("This will anonymise your account, remove saved addresses, and sign you out. Continue?");
    if (!confirmed) return;
    setIsDeleting(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/auth/privacy/delete", { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Deletion failed");
      setLocation("/");
      window.location.reload();
    } catch {
      setSaveMessage({ type: "error", text: "Could not delete your account data" });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-border">
                <AvatarImage src={user.profileImage} alt="Profile" />
                <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">Profile photo</p>
                <p className="text-xs text-muted-foreground">
                  {user.profileImage ? "Synced from Google" : "No photo set"}
                </p>
              </div>
            </div>

            <Separator />

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {saveMessage && (
                <p
                  className={`text-sm px-3 py-2 rounded-md ${
                    saveMessage.type === "success"
                      ? "text-green-700 bg-green-50"
                      : "text-destructive bg-destructive/10"
                  }`}
                >
                  {saveMessage.text}
                </p>
              )}

              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Information about your FabShop account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sign-in method</span>
              <span className="font-medium">{user.profileImage ? "Google OAuth" : "Email & Password"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono text-xs text-muted-foreground">#{user.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Privacy & GDPR
            </CardTitle>
            <CardDescription>Export your data or request account deletion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
              Passwords are stored as secure bcrypt hashes. Payment card details are handled by Stripe and are not stored by FabShop.
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={handleDataExport} disabled={isExporting} className="gap-2">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export my data
              </Button>
              <Button type="button" variant="destructive" onClick={handleAccountDeletion} disabled={isDeleting} className="gap-2">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete my account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
