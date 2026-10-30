import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useQuery as useConvexQuery } from "convex/react";

export default function AIProtectionPage() {
  const events = useQuery(api.dlp.getRecentEvents, { limit: 50 });
  const stats = useQuery(api.dlp.getEventStats);

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">AI Protection</h1>
          <p className="text-sm text-muted-foreground">Monitor AI service usage and DLP detections across your organization.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total AI Requests</p>
              <p className="mt-1 text-3xl font-bold">{stats?.total ?? "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Blocked</p>
              <p className="mt-1 text-3xl font-bold text-destructive">{stats?.blocked ?? "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Warnings</p>
              <p className="mt-1 text-3xl font-bold text-chart-2">{stats?.warned ?? "—"}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">DLP Detections</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events?.filter(e => e.decision !== "allow").map(e => (
                <div key={e._id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={e.decision === "block" ? "destructive" : "outline"} className="text-[10px]">{e.decision.toUpperCase()}</Badge>
                    <Badge variant="outline" className="text-[10px]">{e.classification}</Badge>
                    <span className="text-sm font-medium">{e.employeeName}</span>
                    <span className="text-xs text-muted-foreground">→ {e.destination}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.contentSummary}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {e.reasons.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
              ))}
              {(!events || events.filter(e => e.decision !== "allow").length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">No DLP detections yet. Use the Demo page to simulate events.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
