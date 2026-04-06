import React from "react";

import RoleDashboardPage from "../components/dashboard/RoleDashboardPage";
import { buildRetailerDashboard } from "../utils/roleDashboardData";

export default function RetailerPage() {
  return (
    <RoleDashboardPage
      eyebrow="Retailer Role"
      title="Retailer Dashboard"
      description="Monitor in-store stock, margin potential, and demand pressure from the retail edge."
      accent="#f97316"
      buildData={buildRetailerDashboard}
    />
  );
}
