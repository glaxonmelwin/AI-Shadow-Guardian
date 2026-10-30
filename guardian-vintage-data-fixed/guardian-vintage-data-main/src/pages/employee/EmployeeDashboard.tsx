import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Lock, HardDrive, Activity, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const events = useQuery(api.dlp.getRecentEvents, { limit: 20 });
  const devices = useQuery(api.devices.list);
  const policies = useQuery(api.policies.listEnabled);

  const myEvents = events?.filter(e => e.employeeId === user?._id) || [];
  const myDevices = devices?.filter(d => d.employeeId === user?._id) || [];

  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Security Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your personal security status and recent activity.</p>
        </div>

        {/* Protection Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Device Protection", status: myDevices.length > 0 ? "ACTIVE" : "NONE", icon: ShieldCheck, color: myDevices.length > 0 ? "text-green-700" : "text-muted-foreground" },
            { label: "Agent Status", status: myDevices.some(d => d.status === "online") ? "ONLINE" : "OFFLINE", icon: Activity, color: myDevices.some(d => d.status === "online") ? "text-green-700" : "text-orange-600" },
            { label: "Hardware Guardian", status: myDevices.some(d => d.hardwareState === "protected") ? "CONNECTED" : "N/A", icon: HardDrive, color: myDevices.some(d => d.hardwareState === "protected") ? "text-green-700" : "text-muted-foreground" },
            { label: "Active Policies", status: policies?.length?.toString() || "0", icon: Lock, color: "text-primary" },
          ].map(({ label, status, icon: Icon, color }) => (
            <Card key={label} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`mt-1 text-lg font-bold ${color}`}>{status}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Protection Features */}
        <Card className="mt-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Protection Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: "Clipboard Guard", active: true },
                { name: "AI Protection", active: true },
                { name: "File Protection", active: true },
                { name: "Network Policy", active: true },
              ].map(f => (
                <div key={f.name} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                  <span className="text-sm">{f.name}</span>
                  <Badge variant={f.active ? "default" : "secondary"} className="text-[10px]">
                    {f.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="mt-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">My Recent Security Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myEvents.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No security events on your account.</p>
              ) : myEvents.slice(0, 10).map(e => (
                <div key={e._id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
                  <div className={`status-dot ${e.decision === "block" ? "lockdown" : e.decision === "warn" ? "tampered" : "online"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={e.decision === "block" ? "destructive" : e.decision === "warn" ? "outline" : "secondary"} className="text-[10px]">
                        {e.decision.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{e.application || e.destination}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{e.contentSummary}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
