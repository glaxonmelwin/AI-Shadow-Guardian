import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard.tsx"));
const EventsPage = lazy(() => import("./pages/manager/EventsPage.tsx"));
const EmployeesPage = lazy(() => import("./pages/manager/EmployeesPage.tsx"));
const DevicesPage = lazy(() => import("./pages/manager/DevicesPage.tsx"));
const AIProtectionPage = lazy(() => import("./pages/manager/AIProtectionPage.tsx"));
const PoliciesPage = lazy(() => import("./pages/manager/PoliciesPage.tsx"));
const AlertsPage = lazy(() => import("./pages/manager/AlertsPage.tsx"));
const IncidentsPage = lazy(() => import("./pages/manager/IncidentsPage.tsx"));
const ReportsPage = lazy(() => import("./pages/manager/ReportsPage.tsx"));
const AuditPage = lazy(() => import("./pages/manager/AuditPage.tsx"));
const HardwarePage = lazy(() => import("./pages/manager/HardwarePage.tsx"));

const EmployeeDashboardPage = lazy(() => import("./pages/employee/EmployeeDashboard.tsx"));
const EmployeeEvents = lazy(() => import("./pages/employee/EmployeeEvents.tsx"));
const EmployeePolicies = lazy(() => import("./pages/employee/EmployeePolicies.tsx"));
const EmployeeDevice = lazy(() => import("./pages/employee/EmployeeDevice.tsx"));
const EmployeeProtection = lazy(() => import("./pages/employee/EmployeeProtection.tsx"));
const EmployeeSettings = lazy(() => import("./pages/employee/EmployeeSettings.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground font-[Inter,sans-serif] text-sm">Loading...</div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode }, { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) { console.warn("[VlyToolbar] Caught error:", err.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode }, { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error", stack: error.stack || "" };
  }
  componentDidCatch(err: Error) { console.error("[Preview] Root crash:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">{this.state.message}</p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage({ type: "iframe-route-change", path: location.pathname }, "*");
  }, [location.pathname]);
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />

              {/* Dashboard router - redirects to role-specific page */}
              <Route path="/dashboard" element={<RequireAuth redirectImmediately><Dashboard /></RequireAuth>} />

              {/* Manager routes */}
              <Route path="/dashboard/manager" element={<RequireAuth redirectImmediately><ManagerDashboard /></RequireAuth>} />
              <Route path="/dashboard/manager/events" element={<RequireAuth redirectImmediately><EventsPage /></RequireAuth>} />
              <Route path="/dashboard/manager/employees" element={<RequireAuth redirectImmediately><EmployeesPage /></RequireAuth>} />
              <Route path="/dashboard/manager/devices" element={<RequireAuth redirectImmediately><DevicesPage /></RequireAuth>} />
              <Route path="/dashboard/manager/ai-protection" element={<RequireAuth redirectImmediately><AIProtectionPage /></RequireAuth>} />
              <Route path="/dashboard/manager/policies" element={<RequireAuth redirectImmediately><PoliciesPage /></RequireAuth>} />
              <Route path="/dashboard/manager/alerts" element={<RequireAuth redirectImmediately><AlertsPage /></RequireAuth>} />
              <Route path="/dashboard/manager/incidents" element={<RequireAuth redirectImmediately><IncidentsPage /></RequireAuth>} />
              <Route path="/dashboard/manager/reports" element={<RequireAuth redirectImmediately><ReportsPage /></RequireAuth>} />
              <Route path="/dashboard/manager/audit" element={<RequireAuth redirectImmediately><AuditPage /></RequireAuth>} />
              <Route path="/dashboard/manager/hardware" element={<RequireAuth redirectImmediately><HardwarePage /></RequireAuth>} />
              
              {/* Employee routes */}
              <Route path="/dashboard/employee" element={<RequireAuth redirectImmediately><EmployeeDashboardPage /></RequireAuth>} />
              <Route path="/dashboard/employee/protection" element={<RequireAuth redirectImmediately><EmployeeProtection /></RequireAuth>} />
              <Route path="/dashboard/employee/events" element={<RequireAuth redirectImmediately><EmployeeEvents /></RequireAuth>} />
              <Route path="/dashboard/employee/policies" element={<RequireAuth redirectImmediately><EmployeePolicies /></RequireAuth>} />
              <Route path="/dashboard/employee/device" element={<RequireAuth redirectImmediately><EmployeeDevice /></RequireAuth>} />
              <Route path="/dashboard/employee/settings" element={<RequireAuth redirectImmediately><EmployeeSettings /></RequireAuth>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
