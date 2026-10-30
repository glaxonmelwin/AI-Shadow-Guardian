import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function PoliciesPage() {
  const policies = useQuery(api.policies.list);
  const togglePolicy = useMutation(api.policies.toggle);
  const createPolicy = useMutation(api.policies.create);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", policyCode: "", classification: "SENSITIVE",
    destination: "External AI", riskThreshold: "medium" as const,
    action: "warn" as const,
  });

  const handleToggle = async (id: string) => {
    try { await togglePolicy({ id: id as any }); toast.success("Policy updated"); }
    catch { toast.error("Failed"); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.policyCode) { toast.error("Name and code required"); return; }
    try {
      await createPolicy({ ...form, enabled: true, createdBy: "admin" as any });
      toast.success("Policy created");
      setShowForm(false);
      setForm({ name: "", description: "", policyCode: "", classification: "SENSITIVE", destination: "External AI", riskThreshold: "medium", action: "warn" });
    } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Policies</h1>
            <p className="text-sm text-muted-foreground">Configure data classification and enforcement rules.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> New Policy
          </Button>
        </div>

        {showForm && (
          <Card className="mb-4 border-border/60 bg-card/80">
            <CardHeader><CardTitle className="text-base">Create Policy</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Policy name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Policy code (e.g. POL-007)" value={form.policyCode} onChange={e => setForm({ ...form, policyCode: e.target.value })} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
                <Select value={form.classification} onValueChange={v => setForm({ ...form, classification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="SENSITIVE">Sensitive</SelectItem>
                    <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Destination (e.g. External AI)" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
                <Select value={form.riskThreshold} onValueChange={v => setForm({ ...form, riskThreshold: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Threshold</SelectItem>
                    <SelectItem value="medium">Medium Threshold</SelectItem>
                    <SelectItem value="high">High Threshold</SelectItem>
                    <SelectItem value="critical">Critical Threshold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.action} onValueChange={v => setForm({ ...form, action: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleCreate} className="cursor-pointer">Create Policy</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {!policies ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : policies.length === 0 ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">No policies.</CardContent></Card>
          ) : policies.map(p => (
            <Card key={p._id} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{p.policyCode}</span>
                      <h3 className="font-semibold tracking-tight">{p.name}</h3>
                      <Badge variant={p.enabled ? "default" : "secondary"} className="text-[10px]">{p.enabled ? "Enabled" : "Disabled"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">Data: {p.classification}</Badge>
                      <Badge variant="outline" className="text-[10px]">Destination: {p.destination}</Badge>
                      <Badge variant={p.action === "block" ? "destructive" : p.action === "warn" ? "outline" : "secondary"} className="text-[10px]">
                        Action: {p.action.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">Threshold: {p.riskThreshold}</Badge>
                    </div>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={() => handleToggle(p._id)} className="cursor-pointer" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
