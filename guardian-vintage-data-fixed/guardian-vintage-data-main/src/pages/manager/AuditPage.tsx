import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";

export default function AuditPage() {
  const logs = useQuery(api.auditLogs.list, { limit: 100 });

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Append-only record of all security-relevant actions.</p>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Action</th>
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {!logs ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No audit logs.</td></tr>
                  ) : logs.map(l => (
                    <tr key={l._id} className="border-b border-border/30">
                      <td className="py-2.5 whitespace-nowrap text-xs">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 font-medium text-sm">{l.action}</td>
                      <td className="py-2.5 text-sm">{l.userName}</td>
                      <td className="py-2.5"><Badge variant="outline" className="text-[10px]">{l.category}</Badge></td>
                      <td className="py-2.5 max-w-[300px] truncate text-xs text-muted-foreground">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
