import React from "react";

import RoleDashboardPage from "../components/dashboard/RoleDashboardPage";
import { buildAdminDashboard } from "../utils/roleDashboardData";

export default function AdminPage() {
  return (
    <RoleDashboardPage
      eyebrow="Admin Role"
      title="Admin Dashboard"
      description="Oversee platform-wide health, fraud alerts, and ledger throughput from one control surface."
      accent="#ef4444"
      buildData={buildAdminDashboard}
    />
  );
}
