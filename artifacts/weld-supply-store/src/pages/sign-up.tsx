import { useAuth } from "@/hooks/useAuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Chrome } from "lucide-react";

export default function SignUpPage() {
  const { isAuthenticated, login } = useAuth();
  const [_location, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleGoogleSignUp = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tight font-mono uppercase">FabShop</h1>
          <p className="text-muted-foreground text-sm mt-2">Create your account</p>
        </div>

        {/* Sign Up Card */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create a new account to start shopping for welding supplies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignUp}
              className="w-full h-11 font-semibold"
              size="lg"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Sign Up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Already have an account?</p>
              <a href="/sign-in" className="text-primary hover:underline font-semibold">
                Sign in instead
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-muted-foreground">Track your orders in real-time</span>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-muted-foreground">Save your favorite addresses</span>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-muted-foreground">Faster checkout experience</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
