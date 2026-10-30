import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { User, Mail, Shield, KeyRound, Copy, Check } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export default function EmployeeSettings() {
  const { user } = useAuth();
  const getMyTrackingKey = useMutation(api.users.getMyTrackingKey);
  const [key, setKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGetKey = async () => {
    setLoadingKey(true);
    try {
      const k = await getMyTrackingKey({});
      setKey(k);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setLoadingKey(false);
    }
  };

  const handleCopy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Your account and notification preferences.</p>
        </div>

        <Card className="border-border/60 bg-card/80 max-w-lg">
          <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{user?.name || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{user?.role || "employee"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border-border/60 bg-card/80 max-w-lg">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" />Tracking Key</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this key with your manager so they can add you to their dashboard and monitor your device's security status.
            </p>
            {key ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-border/60 bg-muted px-3 py-2 text-sm font-mono tracking-wide">{key}</code>
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="cursor-pointer shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={handleGetKey} disabled={loadingKey} className="cursor-pointer">
                {loadingKey ? "Generating..." : "Get My Tracking Key"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 border-border/60 bg-card/80 max-w-lg">
          <CardHeader><CardTitle className="text-base">Privacy Notice</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>AI Shadow Guardian monitors data transfer activities for security purposes only. The system:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Does NOT record keystrokes or passwords</li>
                <li>Does NOT access private messages</li>
                <li>Does NOT activate microphones or cameras</li>
                <li>Only scans content at configured policy checkpoints</li>
                <li>Uses data minimization and redaction where possible</li>
                <li>Maintains a full audit trail of monitoring activities</li>
              </ul>
              <p className="mt-2">Contact your IT security team for questions about data handling.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}

