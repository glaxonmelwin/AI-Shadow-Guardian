import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const reports = useQuery(api.reports.list, { limit: 50 });
  const events = useQuery(api.dlp.getRecentEvents, { limit: 200 });
  const generate = useMutation(api.reports.generate);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (type: string, period: string) => {
    setGenerating(true);
    try {
      await generate({ title: `${type} Report - ${period}`, type, period, generatedBy: "admin" as any });
      toast.success("Report generated");
    } catch { toast.error("Failed"); }
    setGenerating(false);
  };

  const exportCSV = () => {
    if (!events || events.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Time", "Employee", "Type", "Destination", "Decision", "Severity", "Risk Score", "Classification", "Summary", "Reasons"];
    const rows = events.map(e => [
      new Date(e.timestamp).toISOString(),
      e.employeeName,
      e.eventType,
      e.destination || "",
      e.decision,
      e.severity,
      String(e.riskScore),
      e.classification,
      `"${e.contentSummary.replace(/"/g, '""')}"`,
      `"${e.reasons.join("; ").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">Generate and view security reports from real database data.</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[
            { type: "daily", period: "daily", label: "Daily Report" },
            { type: "weekly", period: "weekly", label: "Weekly Report" },
            { type: "monthly", period: "monthly", label: "Monthly Report" },
          ].map(({ type, period, label }) => (
            <Card key={type} className="border-border/60 bg-card/80">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">{label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Generate a {period} security summary</p>
                <Button size="sm" className="mt-3 cursor-pointer" onClick={() => handleGenerate(type, period)} disabled={generating}>
                  {generating ? "Generating..." : "Generate"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Generated Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!reports ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : reports.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No reports generated yet.</p>
              ) : reports.map(r => (
                <div key={r._id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{r.title}</h4>
                      <p className="text-xs text-muted-foreground">{r.period} • {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{r.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
