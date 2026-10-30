import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { KeyRound, X, Copy, Check, Laptop } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function EmployeesPage() {
  const { user } = useAuth();
  const users = useQuery(api.users.myEmployees);
  const devices = useQuery(api.devices.list);
  const addEmployeeByKey = useMutation(api.users.addEmployeeByKey);
  const removeManagedEmployee = useMutation(api.users.removeManagedEmployee);
  const createEnrollmentToken = useMutation(api.users.createEnrollmentToken);

  const [key, setKey] = useState("");
  const [adding, setAdding] = useState(false);
  const [tokenFor, setTokenFor] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleAdd = async () => {
    if (!key.trim()) return;
    setAdding(true);
    try {
      const result = await addEmployeeByKey({ key: key.trim() });
      toast.success(`Now tracking ${result.name || result.email || "employee"}`);
      setKey("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (employeeId: string) => {
    try {
      await removeManagedEmployee({ employeeId: employeeId as any });
      toast.success("Employee removed from tracking");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove employee");
    }
  };

  const handleGenerateToken = async (employeeId: string) => {
    if (!user?._id) return;
    try {
      const result = await createEnrollmentToken({ createdBy: user._id as any, employeeId: employeeId as any });
      setTokenFor(employeeId);
      setGeneratedToken(result.token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate enrollment token");
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1500);
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage employees and their device enrollments.</p>
        </div>

        <Card className="mb-4 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" />Add Employee by Key</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 max-w-md">
              <Input
                placeholder="Paste the employee's tracking key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={adding}
              />
              <Button type="button" onClick={handleAdd} disabled={adding || !key.trim()} className="cursor-pointer shrink-0">
                {adding ? "Adding..." : "Add"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Employees find their key on their Settings page. Once added, their device and security activity will appear below.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Employee Directory</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Devices</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {!users ? (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No employees tracked yet. Add one using their key above.</td></tr>
                  ) : users.map((user) => {
                    const userDevices = devices?.filter(d => d.employeeId === user._id) || [];
                    const online = userDevices.some(d => d.status === "online");
                    return (
                      <tr key={user._id} className="border-b border-border/30">
                        <td className="py-2.5 font-medium">{user.name || "Unnamed"}</td>
                        <td className="py-2.5 text-muted-foreground">{user.email || "—"}</td>
                        <td className="py-2.5"><Badge variant="outline" className="text-[10px]">{user.role || "unset"}</Badge></td>
                        <td className="py-2.5">{userDevices.length}</td>
                        <td className="py-2.5">
                          <span className="flex items-center gap-1.5">
                            <div className={`status-dot ${online ? "online" : "offline"}`} />
                            <span className="text-xs">{online ? "Active" : "No active devices"}</span>
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Button type="button" variant="ghost" size="sm" className="cursor-pointer h-7 text-xs" onClick={() => handleGenerateToken(user._id)}>
                            <Laptop className="mr-1 h-3 w-3" />Get enrollment token
                          </Button>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button type="button" variant="ghost" size="icon" className="cursor-pointer h-7 w-7" onClick={() => handleRemove(user._id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {tokenFor && generatedToken && (
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1.5">
                  Enrollment token — expires in 24h, single use. Paste this into the agent's config on the employee's device:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-mono">{generatedToken}</code>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyToken} className="cursor-pointer shrink-0">
                    {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
