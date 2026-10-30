import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export default function EventsPage() {
  const events = useQuery(api.dlp.getRecentEvents, { limit: 200 });
  const stats = useQuery(api.dlp.getEventStats);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (decisionFilter !== "all" && e.decision !== decisionFilter) return false;
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.employeeName.toLowerCase().includes(q) ||
          e.contentSummary.toLowerCase().includes(q) ||
          (e.destination || "").toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, search, decisionFilter, severityFilter]);

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Live Security Events</h1>
          <p className="text-sm text-muted-foreground">Real-time security event feed from all endpoints.</p>
        </div>

        {stats && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Events", value: stats.total },
              { label: "Blocked", value: stats.blocked },
              { label: "Warnings", value: stats.warned },
              { label: "Critical", value: stats.critical },
            ].map(({ label, value }) => (
              <Card key={label} className="border-border/60 bg-card/80">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-4 border-border/60 bg-card/80">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, content, destination..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="allow">Allowed</SelectItem>
                  <SelectItem value="warn">Warned</SelectItem>
                  <SelectItem value="block">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{filteredEvents.length} results</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Event Log</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Destination</th>
                    <th className="pb-2 font-medium">Decision</th>
                    <th className="pb-2 font-medium">Severity</th>
                    <th className="pb-2 font-medium">Risk</th>
                    <th className="pb-2 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {!events ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No events match your filters.</td></tr>
                  ) : filteredEvents.map((e) => (
                    <tr key={e._id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5">{e.employeeName}</td>
                      <td className="py-2.5"><Badge variant="outline" className="text-[10px]">{e.eventType.replace(/_/g, " ")}</Badge></td>
                      <td className="py-2.5 text-xs text-muted-foreground">{e.destination || "—"}</td>
                      <td className="py-2.5">
                        <Badge variant={e.decision === "block" ? "destructive" : e.decision === "warn" ? "outline" : "secondary"} className="text-[10px]">
                          {e.decision.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium ${e.severity === "critical" ? "text-destructive" : e.severity === "high" ? "text-orange-600" : e.severity === "medium" ? "text-yellow-600" : "text-green-700"}`}>
                          {e.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs">{e.riskScore}</td>
                      <td className="py-2.5 max-w-[200px] truncate text-xs text-muted-foreground">{e.contentSummary}</td>
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
