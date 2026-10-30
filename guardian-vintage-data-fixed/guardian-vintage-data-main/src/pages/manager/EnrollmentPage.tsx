import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Key, Cpu } from "lucide-react";

export default function EnrollmentPage() {
  const users = useQuery(api.users.listAll);
  const devices = useQuery(api.devices.list);
  const createToken = useMutation(api.users.createEnrollmentToken);

  const handleCreateToken = async () => {
    try {
      const userId = users?.[0]?._id;
      if (!userId) { toast.error("No users found"); return; }
      await createToken({ createdBy: userId });
      toast.success("Enrollment token generated! Employee can now install the agent.");
    } catch { toast.error("Failed to create token"); }
  };

  const employees = users?.filter(u => u.role === "employee") || [];

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Device Enrollment</h1>
            <p className="text-sm text-muted-foreground">Generate enrollment tokens and manage device registration.</p>
          </div>
          <Button onClick={handleCreateToken} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Generate Token
          </Button>
        </div>

        <Card className="mb-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">How Enrollment Works</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {[
              "Manager generates an enrollment token for the employee",
              "Employee installs the endpoint agent on their device",
              "Agent connects to server using the enrollment token",
              "Device becomes enrolled and appears as PROTECTED / ONLINE",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Enrolled Devices</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!devices ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : devices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No devices enrolled yet.</p>
              ) : devices.map(d => (
                <div key={d._id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{d.deviceName}</span>
                        <Badge variant={d.isEnrolled ? "default" : "outline"} className="text-[10px]">
                          {d.isEnrolled ? "Enrolled" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {d.employeeName} • {d.os} • <span className="font-mono">{d.deviceId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${d.status}`} />
                    <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Employees Without Devices</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No employees found.</p>
              ) : employees.filter(e => !devices?.some(d => d.employeeId === e._id)).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">All employees have devices enrolled.</p>
              ) : employees.filter(e => !devices?.some(d => d.employeeId === e._id)).map(emp => (
                <div key={emp._id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div>
                    <span className="font-medium text-sm">{emp.name || emp.email || "Unnamed"}</span>
                    <p className="text-xs text-muted-foreground">No device enrolled</p>
                  </div>
                  <Button size="sm" variant="outline" className="cursor-pointer text-xs h-7" onClick={handleCreateToken}>
                    <Key className="mr-1 h-3 w-3" /> Generate Token
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
