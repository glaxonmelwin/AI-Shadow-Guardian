import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export default function EmployeeEvents() {
  const { user } = useAuth();
  const events = useQuery(api.dlp.getRecentEvents, { limit: 50 });
  const myEvents = events?.filter(e => e.employeeId === user?._id) || [];

  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Security Events</h1>
          <p className="text-sm text-muted-foreground">Security events related to your account and devices.</p>
        </div>
        <Card className="border-border/60 bg-card/80">
          <CardContent>
            <div className="space-y-2">
              {myEvents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No security events recorded for your account.</p>
              ) : myEvents.map(e => (
                <div key={e._id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={e.decision === "block" ? "destructive" : e.decision === "warn" ? "outline" : "secondary"} className="text-[10px]">
                      {e.decision.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{e.severity}</Badge>
                    <Badge variant="outline" className="text-[10px]">{e.eventType.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{e.contentSummary}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {e.reasons.map((r, i) => <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
