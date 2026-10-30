import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Lock, Mail, Shield, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

type Step = "signIn" | "signUp";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);

  const [step, setStep] = useState<Step>("signIn");
  const [role, setRoleChoice] = useState<"manager" | "employee">("employee");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't preempt-redirect while handlePasswordSubmit/handleGuestLogin are
    // still running — they still need to save the chosen role (setMyRole)
    // before navigating, otherwise this fires first and sends new sign-ups
    // to /dashboard before their role is set, landing them on the wrong
    // (default/employee) dashboard.
    if (!authLoading && isAuthenticated && !isLoading) navigate(redirect);
  }, [authLoading, isAuthenticated, isLoading, navigate, redirect]);

  // Email + password sign in / sign up — stored in this project's own
  // Convex database via the Password auth provider. No external service
  // required, so this works in any environment.
  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const flow = step === "signUp" ? "signUp" : "signIn";
      formData.set("flow", flow);
      if (flow === "signUp") {
        // Role is set atomically inside auth.ts's Password provider profile()
        // callback at account-creation time — no follow-up mutation needed.
        formData.set("role", role);
      }
      // Same reasoning as handleGuestLogin: creating a brand-new account
      // while an old (e.g. guest) session is still active can collide with
      // that stale session instead of cleanly starting a new one.
      if (flow === "signUp" && isAuthenticated) {
        await signOut();
      }
      await signIn("password", formData);
      navigate(redirect);
    } catch (err) {
      // Surface the real Convex error instead of guessing — this makes it
      // possible to tell "email already registered" apart from "Convex
      // backend hasn't picked up the new Password provider yet" apart from
      // "can't reach Convex at all" apart from "account created but role
      // failed to save".
      const raw = err instanceof Error ? err.message : String(err);
      console.error("Sign-up/sign-in error:", err);
      let friendly = raw;
      if (/could not find public function|unknown provider|no such provider/i.test(raw)) {
        friendly =
          "The backend doesn't recognize password sign-in yet. Make sure `npx convex dev` is running and has redeployed (it needs to pick up the new auth.ts).";
      } else if (/invalid password/i.test(raw)) {
        friendly = "Password must be at least 8 characters.";
      } else if (/invalid credentials/i.test(raw)) {
        friendly = "Incorrect email or password.";
      } else if (/already exists|account.*exists/i.test(raw)) {
        friendly = "That email is already registered — try signing in instead.";
      } else if (/failed to fetch|network/i.test(raw)) {
        friendly = "Can't reach the backend. Check that VITE_CONVEX_URL is set and `npx convex dev` is running.";
      } else if (/not authenticated/i.test(raw)) {
        friendly = "Account was created, but saving your role failed. Please go to Settings after signing in and contact support, or try creating the account again.";
      }
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async (role: "manager" | "employee") => {
    setIsLoading(true);
    setError(null);
    try {
      // If a guest (or any) session is already active, switching to a new
      // guest role must start from a clean slate — otherwise Convex Auth
      // can reuse the existing anonymous session/user instead of creating
      // a fresh one, so the role you just picked never actually takes
      // effect and you stay on whatever role the old session had.
      if (isAuthenticated) {
        await signOut();
      }
      // Role is passed straight into the Anonymous provider's profile()
      // callback (see auth.ts) and set atomically at account-creation time
      // — no follow-up mutation, so nothing to race against the redirect.
      await signIn("anonymous", { role });
      navigate(redirect);
    } catch (err) {
      console.error("Guest sign-in error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      setError(
        /failed to fetch|network|websocket/i.test(raw)
          ? "Can't reach the backend. Check that VITE_CONVEX_URL is set and `npx convex dev` is running."
          : `Failed to sign in as guest: ${raw}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.06)_0%,transparent_60%)]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="min-w-[380px] border-border/60 bg-card/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">AI Shadow Guardian</CardTitle>
                <CardDescription>
                  {step === "signUp" ? "Create an account to get started" : "Sign in to access your security dashboard"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="mb-1.5 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" placeholder="name@example.com" type="email" className="pl-9" disabled={isLoading} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-1.5 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        placeholder={step === "signUp" ? "At least 8 characters" : "Your password"}
                        type="password"
                        className="pl-9"
                        disabled={isLoading}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  {step === "signUp" && (
                    <div>
                      <Label className="mb-1.5 block">I am a</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={role === "manager" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setRoleChoice("manager")}
                          disabled={isLoading}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Manager
                        </Button>
                        <Button
                          type="button"
                          variant={role === "employee" ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setRoleChoice("employee")}
                          disabled={isLoading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Employee
                        </Button>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{step === "signUp" ? "Creating account..." : "Signing in..."}</>
                    ) : step === "signUp" ? (
                      <>Create account<ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Sign in<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    {step === "signUp" ? (
                      <>Already have an account?{" "}
                        <Button type="button" variant="link" className="p-0 h-auto cursor-pointer" onClick={() => { setError(null); setStep("signIn"); }}>Sign in</Button>
                      </>
                    ) : (
                      <>Don't have an account?{" "}
                        <Button type="button" variant="link" className="p-0 h-auto cursor-pointer" onClick={() => { setError(null); setStep("signUp"); }}>Create one</Button>
                      </>
                    )}
                  </p>

                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue as</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" className="cursor-pointer" onClick={() => handleGuestLogin("manager")} disabled={isLoading}>
                      <Shield className="mr-2 h-4 w-4" />
                      Guest Manager
                    </Button>
                    <Button type="button" variant="outline" className="cursor-pointer" onClick={() => handleGuestLogin("employee")} disabled={isLoading}>
                      <UserX className="mr-2 h-4 w-4" />
                      Guest Employee
                    </Button>
                  </div>
                </CardContent>
              </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return <Suspense><Auth {...props} /></Suspense>;
}

// Need motion for the entry animation
import { motion } from "framer-motion";
