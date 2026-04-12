import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Lock } from "lucide-react";

export function AdminLogin() {
  const { login, loginError, isLoggingIn } = useAdminAuth();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(password);
    } catch {
      // error shown via loginError
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <span className="text-primary-foreground font-black text-2xl font-mono">F</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight font-mono uppercase">FabShop Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Restricted access. Authorised personnel only.</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" />
              Admin Sign In
            </CardTitle>
            <CardDescription>Enter your admin password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoggingIn || !password}>
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/" className="underline hover:text-foreground transition-colors">← Back to store</a>
        </p>
      </div>
    </div>
  );
}
