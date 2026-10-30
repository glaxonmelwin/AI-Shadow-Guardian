import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Monitor, Shield, AlertTriangle, AlertOctagon, ShieldCheck, Activity, ShieldAlert, Wifi } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = { allow: "#5a7247", warn: "#b8860b", block: "#8b2500" };

export default function ManagerDashboard() {
  const stats = useQuery(api.reports.getDashboardStats);
  const events = useQuery(api.dlp.getRecentEvents, { limit: 10 });

  const isLoading = !stats;

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of your organization's data protection posture.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Devices", value: stats?.totalDevices ?? 0, icon: Monitor, color: "text-primary" },
            { label: "Online Devices", value: stats?.onlineDevices ?? 0, icon: Wifi, color: "text-chart-1" },
            { label: "Protected Devices", value: stats?.protectedDevices ?? 0, icon: ShieldCheck, color: "text-chart-1" },
            { label: "Blocked Requests", value: stats?.blockedRequests ?? 0, icon: ShieldAlert, color: "text-destructive" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{isLoading ? "—" : value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second row stats */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Events", value: stats?.totalEvents ?? 0, icon: Activity, color: "text-primary" },
            { label: "Allowed", value: stats?.allowedRequests ?? 0, icon: ShieldCheck, color: "text-chart-1" },
            { label: "Warnings", value: stats?.warnedRequests ?? 0, icon: AlertTriangle, color: "text-chart-2" },
            { label: "High-Risk Events", value: stats?.highRiskEvents ?? 0, icon: AlertOctagon, color: "text-destructive" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{isLoading ? "—" : value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/80">
            <CardHeader><CardTitle className="text-base font-semibold">Decision Distribution</CardTitle></CardHeader>
            <CardContent>
              {stats ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.byDecision} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {stats.byDecision.map((entry: any, i: number) => (
                        <Cell key={i} fill={i === 0 ? COLORS.allow : i === 1 ? COLORS.warn : COLORS.block} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader><CardTitle className="text-base font-semibold">Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              {stats ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.riskDistribution}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.riskDistribution.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="mt-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base font-semibold">Recent Security Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!events ? (
                <div className="text-sm text-muted-foreground py-4 text-center">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No events recorded yet. Use the Demo page to simulate events.</div>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="flex items-center gap-4 rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5">
                    <div className={`status-dot ${event.decision === "block" ? "lockdown" : event.decision === "warn" ? "tampered" : "online"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{event.employeeName}</span>
                        <Badge variant={event.decision === "block" ? "destructive" : event.decision === "warn" ? "outline" : "secondary"} className="text-[10px]">
                          {event.decision.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{event.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{event.contentSummary}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
