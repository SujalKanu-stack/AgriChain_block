import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Cable,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  Command,
  Crown,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  PlugZap,
  PlusCircle,
  Receipt,
  Search,
  ShieldCheck,
  Store,
  Tractor,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { useBlockchain } from "./BlockchainProvider";
import { LANGUAGE_OPTIONS, useLanguage } from "./LanguageProvider";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, badge: "Live" },
  { to: "/create", label: "Create Product", icon: PlusCircle, badge: "New" },
  { to: "/batches", label: "Product Lots", icon: Boxes, badge: "154" },
  { to: "/shipments", label: "Shipment Tracking", icon: Cable, badge: "Chain" },
  { to: "/ai-insights", label: "AI Insights", icon: Bot, badge: "AI" },
  { to: "/transactions", label: "Activity Timeline", icon: Receipt, badge: "Feed" },
];

const roleNavigation = [
  { to: "/farmer", label: "Farmer", icon: Tractor, badge: "Role" },
  { to: "/distributor", label: "Distributor", icon: Truck, badge: "Role" },
  { to: "/retailer", label: "Retailer", icon: Store, badge: "Role" },
  { to: "/consumer", label: "Consumer", icon: BadgeCheck, badge: "Role" },
  { to: "/admin", label: "Admin", icon: Crown, badge: "Role" },
];

function SidebarNavSection({ collapsed, items, label, onNavigate }) {
  return (
    <div className="sidebar-section">
      {!collapsed && <div className="sidebar-label">{label}</div>}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="sidebar-link-icon">
                <Icon size={18} />
              </span>
              {!collapsed && (
                <>
                  <span className="sidebar-link-label">{item.label}</span>
                  <span className="sidebar-link-badge">{item.badge}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate, mobile = false, t }) {
  return (
    <>
      <div className="sidebar-header">
        <Link className="sidebar-brand" to="/" onClick={onNavigate}>
          <div className="brand-mark">
            <BarChart3 size={18} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-copy">
              <h1>AgriChain</h1>
              <p>Operations intelligence for modern agri supply teams</p>
            </div>
          )}
        </Link>
      </div>

      <SidebarNavSection collapsed={collapsed} items={navigation} label="Workspace" onNavigate={onNavigate} />
      <SidebarNavSection collapsed={collapsed} items={roleNavigation} label="Role Dashboards" onNavigate={onNavigate} />

      <div className="sidebar-footer card-surface">
        <div className="sidebar-footer-icon">
          <ShieldCheck size={18} />
        </div>
        {!collapsed && (
          <div className="sidebar-footer-copy">
            <strong>{t("shell.status", "System healthy")}</strong>
            <span>
              {mobile
                ? t("shell.mobileStatus", "Secure mobile access enabled")
                : t("shell.statusDetail", "Syncing blockchain and API data")}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const {
    wallet,
    connectWallet,
    disconnectWallet,
    recentTransactions,
    demoMode,
    toggleDemoMode,
    hasLiveContract,
  } = useBlockchain();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [activeTransactionModal, setActiveTransactionModal] = useState(null);
  const [seenTransactionIds, setSeenTransactionIds] = useState([]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const latestSuccessfulTransaction = recentTransactions.find(
      (transaction) => transaction.status === "success" && !seenTransactionIds.includes(transaction.id)
    );

    if (latestSuccessfulTransaction) {
      setActiveTransactionModal(latestSuccessfulTransaction);
      setSeenTransactionIds((current) => [...current, latestSuccessfulTransaction.id]);
    }
  }, [recentTransactions, seenTransactionIds]);

  const currentNav = useMemo(
    () =>
      [...navigation, ...roleNavigation].find((item) =>
        item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
      ),
    [location.pathname]
  );

  const walletLabel = wallet.isConnected ? wallet.shortAddress : "Connect MetaMask";
  const chainToneClass = demoMode ? "demo" : wallet.isConnected ? "live" : "idle";
  const pendingTransactions = recentTransactions.filter((transaction) => transaction.status === "pending");

  return (
    <div className={`shell${sidebarCollapsed ? " shell-collapsed" : ""}`}>
      <motion.aside
        className="sidebar sidebar-desktop card-surface"
        animate={{ width: sidebarCollapsed ? 104 : 304 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="sidebar-inner">
          <SidebarContent collapsed={sidebarCollapsed} t={t} />
        </div>
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft size={16} />
          </motion.span>
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-sidebar-backdrop"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="mobile-sidebar card-surface"
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <div className="mobile-sidebar-topbar">
                <div className="sidebar-label">Navigation</div>
                <button
                  type="button"
                  className="mobile-sidebar-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="sidebar-inner">
                <SidebarContent collapsed={false} mobile onNavigate={() => setMobileOpen(false)} t={t} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="content-shell">
        <motion.header
          className="topbar card-surface"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="topbar-row">
            <div className="topbar-leading">
              <button
                type="button"
                className="mobile-nav-button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>

              <div className="topbar-copy">
                {!headerCollapsed && <div className="eyebrow">Premium Operations Shell</div>}
                <div className="topbar-title">{currentNav?.label || "AgriChain"}</div>
                {!headerCollapsed && (
                  <div className="topbar-subtitle">
                    Stripe, Linear, and Vercel-inspired workspace shell with live route continuity.
                  </div>
                )}
              </div>
            </div>

            <div className="topbar-toolbar">
              <label className="topbar-search" htmlFor="dashboard-search">
                <Search size={16} />
                <input
                  id="dashboard-search"
                  type="search"
                  placeholder={t("shell.searchPlaceholder", "Search lots, stages, or activity")}
                />
                <span className="topbar-search-shortcut">
                  <Command size={12} />
                  <span>K</span>
                </span>
              </label>

              <label className="language-switcher" htmlFor="shell-language">
                <span>{t("shell.languageLabel", "Language")}</span>
                <select
                  id="shell-language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  aria-label={t("shell.languageLabel", "Language")}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className={`wallet-connect-button ${wallet.isConnected ? "connected" : ""}`}
                onClick={() => {
                  if (!wallet.isConnected) {
                    connectWallet().catch(() => {});
                  }
                }}
                disabled={wallet.isConnected}
              >
                <Wallet size={16} />
                <span>{walletLabel}</span>
              </button>

              <button type="button" className="profile-chip" aria-label="Profile">
                <span className="profile-avatar">SG</span>
                <span className="profile-copy">
                  <strong>Supply Ops</strong>
                  <span>Admin</span>
                </span>
              </button>

              <button
                type="button"
                className="topbar-collapse-button"
                onClick={() => setHeaderCollapsed((current) => !current)}
                aria-label={headerCollapsed ? "Expand header" : "Collapse header"}
              >
                <motion.span animate={{ rotate: headerCollapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
                  <ChevronDown size={16} />
                </motion.span>
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!headerCollapsed && (
              <motion.div
                className="topbar-expandable"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <div className="topbar-expandable-inner topbar-expandable-grid">
                  <div className="topbar-status-group">
                    <div className="topbar-chip wallet-chip">
                      <PlugZap size={16} />
                      <div>
                        <strong>{wallet.isConnected ? wallet.address : "Wallet not connected"}</strong>
                        <span>{wallet.networkName}</span>
                      </div>
                    </div>

                    <div className={`topbar-chip chain-status-chip ${chainToneClass}`}>
                      <div>
                        <strong>{demoMode ? "Demo Mode" : wallet.chainStatus}</strong>
                        <span>{hasLiveContract ? "Contract ready" : "Missing contract address"}</span>
                      </div>
                    </div>

                    <button type="button" className="demo-toggle-button" onClick={toggleDemoMode}>
                      {demoMode ? "Switch To Live" : "Switch To Demo"}
                    </button>

                    {wallet.isConnected ? (
                      <button type="button" className="demo-toggle-button" onClick={disconnectWallet}>
                        Disconnect Wallet
                      </button>
                    ) : null}

                    <button type="button" className="icon-button notification-button" aria-label="Notifications">
                      <Bell size={16} />
                      <span className="notification-dot" />
                    </button>

                    <ThemeToggle compact />

                    <div className="topbar-role-pill">
                      <UserRound size={14} />
                      <span>{currentNav?.label || "Dashboard"}</span>
                    </div>
                  </div>

                  <div className="topbar-tx-panel">
                    <div className="section-heading">
                      <h3>Explorer Links</h3>
                      <p>Recent wallet-signed blockchain actions for the live demo.</p>
                    </div>
                    {pendingTransactions.length ? (
                      <div className="topbar-pending-banner">
                        <LoaderCircle size={14} />
                        <span>{pendingTransactions.length} wallet transaction pending confirmation.</span>
                      </div>
                    ) : null}
                    {recentTransactions.length ? (
                      <div className="topbar-tx-list">
                        {recentTransactions.map((tx) => (
                          <div key={tx.id} className={`topbar-tx-item ${tx.status}`}>
                            <div>
                              <strong>{tx.action}</strong>
                              <p>
                                {tx.hash.slice(0, 16)}
                                {tx.hash.length > 16 ? "..." : ""}
                              </p>
                            </div>
                            <div className="topbar-tx-meta">
                              <span>{tx.demoMode ? "Demo" : tx.status}</span>
                              {tx.explorerUrl ? (
                                <a href={tx.explorerUrl} target="_blank" rel="noreferrer">
                                  Explorer
                                  <ExternalLink size={12} />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="topbar-tx-empty">No signed transactions yet.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <motion.main
          className="page-content"
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.main>

        <AnimatePresence>
          {activeTransactionModal ? (
            <>
              <motion.button
                type="button"
                className="tx-modal-backdrop"
                aria-label="Close transaction status"
                onClick={() => setActiveTransactionModal(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="tx-modal card-surface"
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="tx-modal-icon">
                  <CheckCircle2 size={18} />
                </div>
                <div className="tx-modal-copy">
                  <div className="eyebrow">Transaction Signed</div>
                  <h3>{activeTransactionModal.action}</h3>
                  <p>
                    {activeTransactionModal.demoMode
                      ? "Demo blockchain action completed and mirrored successfully."
                      : "Wallet signature confirmed and the transaction has been recorded successfully."}
                  </p>
                  <div className="tx-modal-meta">
                    <div>
                      <span>Tx hash</span>
                      <strong>{activeTransactionModal.hash}</strong>
                    </div>
                    <div>
                      <span>Network</span>
                      <strong>{activeTransactionModal.networkName}</strong>
                    </div>
                  </div>
                </div>
                <div className="tx-modal-actions">
                  {activeTransactionModal.explorerUrl ? (
                    <a
                      className="button button-secondary"
                      href={activeTransactionModal.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setActiveTransactionModal(null)}
                  >
                    Continue Demo
                  </button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
