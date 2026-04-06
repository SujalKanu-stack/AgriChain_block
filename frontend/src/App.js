import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";
import { BlockchainProvider } from "./components/BlockchainProvider";
import { LanguageProvider } from "./components/LanguageProvider";
import Layout from "./components/Layout";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import AIInsightsPage from "./pages/AIInsightsPage";
import AdminPage from "./pages/AdminPage";
import BatchesPage from "./pages/BatchesPage";
import ConsumerPage from "./pages/ConsumerPage";
import ConsumerQualityPage from "./pages/ConsumerQualityPage";
import CreateBatchPage from "./pages/CreateBatchPage";
import DashboardPage from "./pages/DashboardPage";
import DistributorPage from "./pages/DistributorPage";
import FarmerPage from "./pages/FarmerPage";
import RetailerPage from "./pages/RetailerPage";
import ShipmentTrackingPage from "./pages/ShipmentTrackingPage";
import TransactionsPage from "./pages/TransactionsPage";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ToastProvider>
            <BlockchainProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/create" element={<CreateBatchPage />} />
                  <Route path="/batches" element={<BatchesPage />} />
                  <Route path="/shipments" element={<ShipmentTrackingPage />} />
                  <Route path="/ai-insights" element={<AIInsightsPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/farmer" element={<FarmerPage />} />
                  <Route path="/distributor" element={<DistributorPage />} />
                  <Route path="/retailer" element={<RetailerPage />} />
                  <Route path="/consumer" element={<ConsumerPage />} />
                  <Route path="/consumer-ai" element={<ConsumerQualityPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </Layout>
            </BlockchainProvider>
          </ToastProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
