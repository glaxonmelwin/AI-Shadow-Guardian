import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, AlertTriangle, Server, FileCheck, ShieldCheck, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isAuthenticated && user) {
      navigate(user.role === "manager" ? "/dashboard/manager" : "/dashboard/employee");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">AI Shadow Guardian</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth?returnTo=/dashboard")} className="cursor-pointer">
              Sign In
            </Button>
            <Button onClick={handleCTA} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              {isAuthenticated ? "Dashboard" : "Get Started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08)_0%,transparent_70%)]" />
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Enterprise Data Loss Prevention for AI Systems
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Protect Your Data from
            <br />
            <span className="text-primary">AI-Powered Leaks</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            AI Shadow Guardian detects and prevents confidential data from leaking through ChatGPT, AI coding assistants, and unauthorized external services. Real-time protection for the modern workplace.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={handleCTA} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              {isAuthenticated ? "Open Dashboard" : "Start Protecting Now"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth?returnTo=/dashboard&role=manager")} className="cursor-pointer px-8">
              Manager Login
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Comprehensive DLP Protection</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Multi-layered security engine that detects, classifies, and prevents data leakage across all channels.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[
              { icon: Lock, title: "AI Destination Control", desc: "Monitor and control which AI services can receive organizational data. Block unauthorized destinations in real-time." },
              { icon: Eye, title: "DLP Content Scanning", desc: "Detect secrets, PII, source code, and confidential patterns before they leave your network." },
              { icon: AlertTriangle, title: "Real-Time Alerts", desc: "Instant notifications for high-risk events. Live dashboard shows security events as they happen." },
              { icon: Server, title: "Hardware Integration", desc: "Optional security controller adds a trusted enforcement layer with tamper detection and lockdown capabilities." },
              { icon: FileCheck, title: "Policy Engine", desc: "Configurable rules for classification, risk thresholds, and enforcement actions (allow, warn, block)." },
              { icon: Shield, title: "Incident Management", desc: "Automated incident creation, investigation workflow, and resolution tracking with full audit trail." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp}>
                <Card className="vintage-card h-full border-border/60 bg-card/80">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="border-y border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              From endpoint detection to real-time dashboard updates, every layer works together.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 flex flex-col items-center gap-4"
          >
            {[
              { step: "1", title: "Employee Action", desc: "Content is typed, pasted, or uploaded to an AI service" },
              { step: "2", title: "DLP Engine Analysis", desc: "Secrets, PII, source code, and keywords are detected and classified" },
              { step: "3", title: "Policy Decision", desc: "Risk score is evaluated against organizational policies (Allow / Warn / Block)" },
              { step: "4", title: "Real-Time Response", desc: "Event is logged, alert generated, incident created, and dashboard updated live" },
            ].map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex w-full max-w-lg items-center gap-4 rounded-lg border border-border/60 bg-card/80 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step}
                </div>
                <div>
                  <h4 className="font-semibold tracking-tight">{title}</h4>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-sm">&copy; {new Date().getFullYear()} AI Shadow Guardian. Enterprise Data Protection.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
