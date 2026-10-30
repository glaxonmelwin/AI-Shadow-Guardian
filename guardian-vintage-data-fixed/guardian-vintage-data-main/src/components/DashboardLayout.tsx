import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Activity, Users, Monitor, BrainCircuit, FileText, AlertTriangle, AlertOctagon, BookOpen, HardDrive, Settings, LogOut, Scan } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

const managerItems = [
  { title: "Dashboard", url: "/dashboard/manager", icon: LayoutDashboard },
  { title: "Live Events", url: "/dashboard/manager/events", icon: Activity },
  { title: "Employees", url: "/dashboard/manager/employees", icon: Users },
  { title: "Devices", url: "/dashboard/manager/devices", icon: Monitor },
  { title: "AI Protection", url: "/dashboard/manager/ai-protection", icon: BrainCircuit },
  { title: "Policies", url: "/dashboard/manager/policies", icon: FileText },
  { title: "Alerts", url: "/dashboard/manager/alerts", icon: AlertTriangle },
  { title: "Incidents", url: "/dashboard/manager/incidents", icon: AlertOctagon },
  { title: "Reports", url: "/dashboard/manager/reports", icon: BookOpen },
  { title: "Audit Logs", url: "/dashboard/manager/audit", icon: Scan },
  { title: "Hardware", url: "/dashboard/manager/hardware", icon: HardDrive },
 
];

const employeeItems = [
  { title: "Dashboard", url: "/dashboard/employee", icon: LayoutDashboard },
  { title: "My Protection", url: "/dashboard/employee/protection", icon: Shield },
  { title: "Security Events", url: "/dashboard/employee/events", icon: Activity },
  { title: "Policies", url: "/dashboard/employee/policies", icon: FileText },
  { title: "My Device", url: "/dashboard/employee/device", icon: Monitor },
  { title: "Settings", url: "/dashboard/employee/settings", icon: Settings },
];

export function DashboardLayout({ children, role }: { children: ReactNode; role: "manager" | "employee" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = role === "manager" ? managerItems : employeeItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-primary">AI Shadow Guardian</span>
              <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">{role}</span>
            </div>
          </div>
          <Separator className="bg-sidebar-border" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url} className="cursor-pointer text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent">
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto border-t border-sidebar-border p-4">
            <div className="mb-2 text-xs text-sidebar-foreground/60">{user?.name || user?.email || "User"}</div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start cursor-pointer text-sidebar-foreground/80 hover:text-sidebar-primary">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <header className="flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm">
            <SidebarTrigger className="cursor-pointer lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="status-dot online" />
              <span>System Active</span>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
