import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuthContext";
import { Loader2 } from "lucide-react";

export default function AuthSuccess() {
  const { refresh } = useAuth();
  const [_location, setLocation] = useLocation();

  useEffect(() => {
    refresh().then(() => {
      setLocation("/");
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
