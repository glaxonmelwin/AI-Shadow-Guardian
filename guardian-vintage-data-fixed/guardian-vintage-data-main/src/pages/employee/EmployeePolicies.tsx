import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

export default function EmployeePolicies() {
  const policies = useQuery(api.policies.listEnabled);

  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Security Policies</h1>
          <p className="text-sm text-muted-foreground">Policies that apply to your device and activities.</p>
        </div>
        <div className="space-y-3">
          {!policies ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : policies.length === 0 ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">No active policies.</CardContent></Card>
          ) : policies.map(p => (
            <Card key={p._id} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{p.policyCode}</span>
                  <h3 className="font-semibold tracking-tight">{p.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">Data: {p.classification}</Badge>
                  <Badge variant="outline" className="text-[10px]">Destination: {p.destination}</Badge>
                  <Badge variant={p.action === "block" ? "destructive" : p.action === "warn" ? "outline" : "secondary"} className="text-[10px]">
                    {p.action.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
