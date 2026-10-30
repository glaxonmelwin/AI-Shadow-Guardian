import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Globe } from "lucide-react";

export default function DestinationsPage() {
  const destinations = useQuery(api.destinations.list);
  const createDest = useMutation(api.destinations.create);
  const removeDest = useMutation(api.destinations.remove);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("AI Assistant");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [action, setAction] = useState<"allow" | "warn" | "block">("warn");

  const handleCreate = async () => {
    if (!name || !domain) { toast.error("Name and domain required"); return; }
    try {
      await createDest({ name, domain, category, riskLevel, action, enabled: true });
      toast.success("Destination added");
      setShowForm(false); setName(""); setDomain("");
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeDest({ id: id as any });
      toast.success("Removed");
    } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Destinations</h1>
            <p className="text-sm text-muted-foreground">Control which AI services can receive organizational data.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Add Destination
          </Button>
        </div>

        {showForm && (
          <Card className="mb-4 border-border/60 bg-card/80">
            <CardHeader><CardTitle className="text-base">New Destination</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Service name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Domain (e.g., chat.openai.com)" value={domain} onChange={e => setDomain(e.target.value)} />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI Assistant">AI Assistant</SelectItem>
                    <SelectItem value="AI Coding">AI Coding</SelectItem>
                    <SelectItem value="Internal AI">Internal AI</SelectItem>
                    <SelectItem value="Unknown AI">Unknown AI</SelectItem>
                    <SelectItem value="File Upload">File Upload</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={action} onValueChange={(v) => setAction(v as any)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleCreate} className="cursor-pointer">Save</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Configured Destinations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!destinations ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : destinations.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No destinations configured.</p>
              ) : destinations.map(d => (
                <div key={d._id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{d.name}</span>
                        <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.action === "block" ? "destructive" : d.action === "warn" ? "outline" : "secondary"} className="text-[10px]">
                      {d.action.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{d.riskLevel}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(d._id)} className="cursor-pointer h-7 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
