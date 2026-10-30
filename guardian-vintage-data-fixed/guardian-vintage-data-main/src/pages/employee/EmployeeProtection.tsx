import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Eye, FileText, Network, Lock } from "lucide-react";

const features = [
  { name: "Clipboard Guard", desc: "Monitors clipboard for sensitive data", icon: Eye, active: true },
  { name: "AI Protection", desc: "Analyzes content sent to AI services", icon: Shield, active: true },
  { name: "File Protection", desc: "Scans file transfers for classified data", icon: FileText, active: true },
  { name: "Network Policy", desc: "Controls outbound destination access", icon: Network, active: true },
  { name: "Secret Detection", desc: "Identifies API keys, tokens, and credentials", icon: Lock, active: true },
  { name: "PII Protection", desc: "Detects personal identifiable information", icon: ShieldCheck, active: true },
];

export default function EmployeeProtection() {
  return (
    <DashboardLayout role="employee">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Protection</h1>
          <p className="text-sm text-muted-foreground">Overview of the security features protecting your device.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <Card key={f.name} className="border-border/60 bg-card/80">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold tracking-tight">{f.name}</h3>
                    <Badge variant={f.active ? "default" : "secondary"} className="text-[10px] mt-0.5">{f.active ? "ACTIVE" : "INACTIVE"}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-border/60 bg-card/80">
          <CardHeader><CardTitle className="text-base">Data Classification Levels</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 rounded-lg bg-green-50/50 border border-green-200/50 p-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">SAFE</Badge>
                <span>General, non-sensitive content. Allowed through all channels.</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-yellow-50/50 border border-yellow-200/50 p-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px]">SENSITIVE</Badge>
                <span>Internal information. May trigger warnings before sending externally.</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-orange-50/50 border border-orange-200/50 p-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-[10px]">CONFIDENTIAL</Badge>
                <span>Business-critical data. Typically blocked from external AI services.</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-red-50/50 border border-red-200/50 p-3">
                <Badge variant="destructive" className="text-[10px]">CRITICAL</Badge>
                <span>Credentials, secrets, PII. Always blocked from external destinations.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
