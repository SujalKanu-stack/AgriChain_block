import React from "react";

import RoleDashboardPage from "../components/dashboard/RoleDashboardPage";
import { buildFarmerDashboard } from "../utils/roleDashboardData";

export default function FarmerPage() {
  return (
    <RoleDashboardPage
      eyebrow="Farmer Role"
      title="Farmer Dashboard"
      description="Manage harvest-side inventory, create batches, and track direct revenue from the origin point."
      accent="#10b981"
      buildData={buildFarmerDashboard}
    />
  );
}
