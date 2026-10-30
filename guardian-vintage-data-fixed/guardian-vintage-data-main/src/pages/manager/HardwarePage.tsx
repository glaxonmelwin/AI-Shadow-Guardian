import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { HardDrive, AlertTriangle, Lock, Unlock } from "lucide-react";

export default function HardwarePage() {
  const hwStates = useQuery(api.hardware.list);
  const setState = useMutation(api.hardware.setState);
  const simulateTamper = useMutation(api.hardware.simulateTamper);
  const triggerLockdown = useMutation(api.hardware.triggerLockdown);
  const releaseLockdown = useMutation(api.hardware.releaseLockdown);

  const handleSimulateTamper = async (deviceId: string) => {
    try {
      await simulateTamper({ deviceId });
      toast.success("Tamper simulated");
    } catch { toast.error("Failed"); }
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Hardware Security Controller</h1>
          <p className="text-sm text-muted-foreground">Monitor hardware security state and simulate controller events.</p>
        </div>

        <div className="space-y-4">
          {!hwStates ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
          ) : hwStates.length === 0 ? (
            <Card className="border-border/60 bg-card/80"><CardContent className="py-8 text-center text-sm text-muted-foreground">No hardware controllers registered. Enroll a device first.</CardContent></Card>
          ) : hwStates.map(hw => (
            <Card key={hw._id} className="border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">{hw.deviceId}</span>
                      <Badge variant={hw.state === "protected" ? "default" : hw.state === "tampered" || hw.state === "lockdown" ? "destructive" : "outline"} className="text-[10px]">
                        {hw.state.toUpperCase()}
                      </Badge>
                      {hw.tamperDetected && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="mr-1 h-3 w-3" />TAMPER DETECTED</Badge>}
                      {hw.lockdownActive && <Badge variant="destructive" className="text-[10px]"><Lock className="mr-1 h-3 w-3" />LOCKDOWN ACTIVE</Badge>}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Firmware: {hw.firmwareVersion || "—"}</div>
                      <div>Policy v{hw.policyVersion}</div>
                      <div>Last heartbeat: {new Date(hw.lastHeartbeat).toLocaleString()}</div>
                      <div>Serial: {hw.serialPort || "—"}</div>
                    </div>
                    {hw.lockdownReason && (
                      <div className="mt-2 rounded bg-destructive/10 p-2 text-xs">
                        <span className="font-medium text-destructive">Lockdown reason:</span> {hw.lockdownReason}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {hw.state !== "lockdown" ? (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => handleLockdown(hw.deviceId)} className="cursor-pointer text-xs h-7">
                          <Lock className="mr-1 h-3 w-3" /> Lockdown
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSimulateTamper(hw.deviceId)} className="cursor-pointer text-xs h-7">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Simulate Tamper
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleRelease(hw.deviceId)} className="cursor-pointer text-xs h-7">
                        <Unlock className="mr-1 h-3 w-3" /> Release Lockdown
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
