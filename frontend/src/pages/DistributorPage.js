import React from "react";

import RoleDashboardPage from "../components/dashboard/RoleDashboardPage";
import { buildDistributorDashboard } from "../utils/roleDashboardData";

export default function DistributorPage() {
  return (
    <RoleDashboardPage
      eyebrow="Distributor Role"
      title="Distributor Dashboard"
      description="Track shipments, monitor route health, and surface spoilage risk across moving lots."
      accent="#0ea5e9"
      buildData={buildDistributorDashboard}
    />
  );
}
