import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AlertsPage() {
  const alerts = useQuery(api.alerts.list, { limit: 100 });
  const updateStatus = useMutation(api.alerts.updateStatus);

  const handleAck = async (id: string) => {
    try {
      await updateStatus({ id: id as any, status: "acknowledged" });
      toast.success("Alert acknowledged");
    } catch { toast.error("Failed"); }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateStatus({ id: id as any, status: "resolved", resolution: "Resolved by manager" });
      toast.success("Alert resolved");
    } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-sm text-muted-foreground">Active and resolved security alerts.</p>
        </div>

        <div className="space-y-3">
          {!alerts ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : alerts.length === 0 ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">No alerts.</CardContent></Card>
          ) : alerts.map(a => (
            <Card key={a._id} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "high" ? "destructive" : "outline"} className="text-[10px]">
                        {a.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                      <span className="text-xs text-muted-foreground">{a.category}</span>
                    </div>
                    <p className="mt-1 text-sm">{a.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.employeeName} • {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {a.status === "open" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleAck(a._id)} className="cursor-pointer text-xs h-7">Acknowledge</Button>
                        <Button size="sm" onClick={() => handleResolve(a._id)} className="cursor-pointer text-xs h-7">Resolve</Button>
                      </>
                    )}
                    {a.status === "acknowledged" && (
                      <Button size="sm" onClick={() => handleResolve(a._id)} className="cursor-pointer text-xs h-7">Resolve</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
