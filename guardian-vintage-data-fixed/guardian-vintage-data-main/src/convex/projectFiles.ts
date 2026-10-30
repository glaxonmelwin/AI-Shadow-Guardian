"use node";

import { action } from "./_generated/server";
import fs from "fs";
import path from "path";

// List of all project source files to include in the download
const SOURCE_FILES = [
  // Config files
  "package.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "index.html",
  "postcss.config.cjs",
  "eslint.config.js",
  "components.json",
  "convex.json",
  ".gitignore",

  // Convex backend
  "src/convex/schema.ts",
  "src/convex/dlp.ts",
  "src/convex/policies.ts",
  "src/convex/devices.ts",
  "src/convex/alerts.ts",
  "src/convex/incidents.ts",
  "src/convex/auditLogs.ts",
  "src/convex/reports.ts",
  "src/convex/hardware.ts",
  "src/convex/destinations.ts",
  "src/convex/seed.ts",
  "src/convex/demo.ts",
  "src/convex/users.ts",
  "src/convex/http.ts",
  "src/convex/auth.config.ts",
  "src/convex/auth/emailOtp.ts",

  // Frontend - main
  "src/main.tsx",
  "src/index.css",
  "src/vite-env.d.ts",
  "src/instrumentation.tsx",

  // Frontend - pages
  "src/pages/Landing.tsx",
  "src/pages/Auth.tsx",
  "src/pages/Dashboard.tsx",
  "src/pages/ManagerDashboard.tsx",
  "src/pages/NotFound.tsx",
  "src/pages/manager/EventsPage.tsx",
  "src/pages/manager/EmployeesPage.tsx",
  "src/pages/manager/DevicesPage.tsx",
  "src/pages/manager/AIProtectionPage.tsx",
  "src/pages/manager/PoliciesPage.tsx",
  "src/pages/manager/AlertsPage.tsx",
  "src/pages/manager/IncidentsPage.tsx",
  "src/pages/manager/ReportsPage.tsx",
  "src/pages/manager/AuditPage.tsx",
  "src/pages/manager/HardwarePage.tsx",
  "src/pages/manager/DemoPage.tsx",
  "src/pages/manager/DestinationsPage.tsx",
  "src/pages/manager/EnrollmentPage.tsx",
  "src/pages/employee/EmployeeDashboard.tsx",
  "src/pages/employee/EmployeeEvents.tsx",
  "src/pages/employee/EmployeePolicies.tsx",
  "src/pages/employee/EmployeeDevice.tsx",
  "src/pages/employee/EmployeeProtection.tsx",
  "src/pages/employee/EmployeeSettings.tsx",

  // Frontend - components
  "src/components/DashboardLayout.tsx",
  "src/components/SecurityScore.tsx",
  "src/components/RequireAuth.tsx",
  "src/components/LogoDropdown.tsx",

  // Frontend - hooks
  "src/hooks/use-auth.ts",
  "src/hooks/use-mobile.ts",
  "src/hooks/useRealtimeToasts.ts",

  // Frontend - lib
  "src/lib/utils.ts",
  "src/lib/vly-integrations.ts",

  // README
  "README.md",
];

export const getAllFiles = action({
  args: {},
  handler: async () => {
    const files: Record<string, string> = {};
    const root = process.cwd();

    for (const filePath of SOURCE_FILES) {
      try {
        const fullPath = path.join(root, filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          files[filePath] = content;
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return files;
  },
});
