import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Monitor, HardDrive, Shield } from "lucide-react";

export default function EmployeeDevice() {
  const { user } = useAuth();
  const devices = useQuery(api.devices.list);
  const hwStates = useQuery(api.hardware.list);
  const myDevices = devices?.filter(d => d.employeeId === user?._id) || [];

  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Device</h1>
          <p className="text-sm text-muted-foreground">Status of your enrolled devices and hardware.</p>
        </div>

        {myDevices.length === 0 ? (
          <Card className="border-border/60 bg-card/80">
            <CardContent className="py-12 text-center">
              <Monitor className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No devices enrolled yet. Contact your manager to enroll a device.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myDevices.map(d => {
              const hw = hwStates?.find(h => h.deviceId === d.deviceId);
              return (
                <Card key={d._id} className="border-border/60 bg-card/80">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{d.deviceName}</h3>
                      <Badge variant={d.status === "online" ? "default" : "outline"} className="text-[10px]">{d.status.toUpperCase()}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Device ID</span><span className="font-mono text-xs">{d.deviceId}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">OS</span><span>{d.os}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Agent Version</span><span>{d.agentVersion}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Protection</span>
                          <Badge variant={d.protectionStatus === "active" ? "default" : "secondary"} className="text-[10px]">{d.protectionStatus}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Hardware Status</span>
                          <Badge variant={hw?.state === "protected" ? "default" : "outline"} className="text-[10px]">{hw?.state || "N/A"}</Badge>
                        </div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Firmware</span><span>{hw?.firmwareVersion || "N/A"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last Heartbeat</span><span>{new Date(d.lastHeartbeat).toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Enrolled</span><span>{new Date(d.enrollmentDate).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
