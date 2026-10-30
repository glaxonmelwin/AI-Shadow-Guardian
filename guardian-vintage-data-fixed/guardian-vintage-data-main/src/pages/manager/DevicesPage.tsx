import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DevicesPage() {
  const devices = useQuery(api.devices.list);
  const hwStates = useQuery(api.hardware.list);
  const triggerLockdown = useMutation(api.hardware.triggerLockdown);
  const releaseLockdown = useMutation(api.hardware.releaseLockdown);

  const handleLockdown = async (deviceId: string) => {
    try {
      await triggerLockdown({ deviceId, triggeredBy: "admin" as any, reason: "Emergency lockdown" });
      toast.success("Lockdown triggered");
    } catch { toast.error("Failed"); }
  };

  const handleRelease = async (deviceId: string) => {
    try {
      await releaseLockdown({ deviceId });
      toast.success("Lockdown released");
    } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout role="manager">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage enrolled endpoint devices.</p>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Enrolled Devices</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Device ID</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium">OS</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Protection</th>
                    <th className="pb-2 font-medium">Hardware</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!devices ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : devices.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No devices enrolled.</td></tr>
                  ) : devices.map((d) => {
                    const hw = hwStates?.find(h => h.deviceId === d.deviceId);
                    return (
                      <tr key={d._id} className="border-b border-border/30">
                        <td className="py-2.5 font-mono text-xs">{d.deviceId}</td>
                        <td className="py-2.5">{d.deviceName}</td>
                        <td className="py-2.5">{d.employeeName}</td>
                        <td className="py-2.5 text-xs">{d.os}</td>
                        <td className="py-2.5">
                          <span className="flex items-center gap-1.5">
                            <div className={`status-dot ${d.status}`} />
                            <span className="text-xs capitalize">{d.status}</span>
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Badge variant={d.protectionStatus === "active" ? "default" : "outline"} className="text-[10px]">
                            {d.protectionStatus}
                          </Badge>
                        </td>
                        <td className="py-2.5">
                          <Badge variant={hw?.state === "protected" ? "default" : hw?.state === "tampered" ? "destructive" : "outline"} className="text-[10px]">
                            {hw?.state || "N/A"}
                          </Badge>
                        </td>
                        <td className="py-2.5">
                          {d.status === "lockdown" ? (
                            <Button size="sm" variant="outline" onClick={() => handleRelease(d.deviceId)} className="cursor-pointer text-xs h-7">
                              <Unlock className="mr-1 h-3 w-3" /> Release
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={() => handleLockdown(d.deviceId)} className="cursor-pointer text-xs h-7">
                              <Lock className="mr-1 h-3 w-3" /> Lock
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
