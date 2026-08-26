import { useState } from "react";
import { ToastContainer, useToast, Icons, SearchBar } from "./components/ui";
import { useApp } from "./context/AppContext";
import Dashboard from "./screens/Dashboard";
import Inventory from "./screens/Inventory";
import Suppliers from "./screens/Suppliers";
import StockReceiving from "./screens/StockReceiving";
import StockIssuing from "./screens/StockIssuing";
import StockTransfer from "./screens/StockTransfer";
import StockTracking from "./screens/StockTracking";
import StockTaking from "./screens/StockTaking";
import Users from "./screens/Users";
import RolesPermissions from "./screens/RolesPermissions";
import Reports from "./screens/Reports";
import AuditLog from "./screens/AuditLog";
import Notifications from "./screens/Notifications";
import Settings from "./screens/Settings";

type Screen =
  | "dashboard"
  | "inventory"
  | "stock-receiving"
  | "stock-issuing"
  | "stock-transfer"
  | "stock-tracking"
  | "stock-taking"
  | "suppliers"
  | "users"
  | "roles"
  | "reports"
  | "audit"
  | "notifications"
  | "settings";

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [{ id: "dashboard", label: "Dashboard", icon: Icons.dashboard }],
  },
  {
    label: "Inventory",
    items: [
      { id: "inventory", label: "Inventory", icon: Icons.inventory },
      { id: "suppliers", label: "Suppliers", icon: Icons.suppliers },
    ],
  },
  {
    label: "Stock Operations",
    items: [
      { id: "stock-receiving", label: "Receiving", icon: Icons.receive },
      { id: "stock-issuing", label: "Issuing", icon: Icons.issue },
      { id: "stock-transfer", label: "Transfer", icon: Icons.transfer },
      { id: "stock-tracking", label: "Tracking", icon: Icons.tracking },
      { id: "stock-taking", label: "Stock Taking", icon: Icons.stocktake },
    ],
  },
  {
    label: "People",
    items: [
      { id: "users", label: "Users", icon: Icons.users },
      { id: "roles", label: "Roles & Permissions", icon: Icons.roles },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "reports", label: "Reports", icon: Icons.reports },
      { id: "audit", label: "Audit Log", icon: Icons.audit },
    ],
  },
];

const screenTitles: Record<Screen, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory Management",
  suppliers: "Supplier Management",
  "stock-receiving": "Stock Receiving",
  "stock-issuing": "Stock Issuing",
  "stock-transfer": "Stock Transfer",
  "stock-tracking": "Stock Tracking",
  "stock-taking": "Stock Taking",
  users: "User Management",
  roles: "Roles & Permissions",
  reports: "Reports",
  audit: "Audit Log",
  notifications: "Notifications",
  settings: "Settings",
};

function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("admin@stockmgt.gov.et");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/stock-management-logo.svg" alt="StockManager" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A]">StockManager</h1>
          <p className="text-sm text-[#64748B] mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#334155]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stockmgt.gov.et"
              className="w-full h-10 mt-1.5 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE] outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#334155]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-10 mt-1.5 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:border-[#4F46E5] focus:ring-2 focus:ring-[#C7D2FE] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#4F46E5] text-white font-medium rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-xs text-[#94A3B8] text-center mt-2">
            Demo: admin@stockmgt.gov.et / password
          </p>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { toasts, toast, remove } = useToast();

  const { notifications, inventoryItems, stockCards, requisitions, transfers, isAuthenticated, currentUser, login, logout, isLoading, apiStatus } = useApp();
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const lowStockCount = inventoryItems.filter(i => stockCards.some(sc => sc.itemId === i.id && sc.availableQty <= i.minimumStock)).length;
  const pendingApprovals = requisitions.filter(r => r.status === 'SUBMITTED').length + transfers.filter(t => t.status === 'SUBMITTED').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <img src="/stock-management-logo.svg" alt="StockManager" className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-[#64748B]">Loading StockManager...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={login} />
        <ToastContainer toasts={toasts} onRemove={remove} />
      </>
    );
  }

  const navigate = (s: Screen) => {
    setScreen(s);
    setUserMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`flex flex-col bg-[#0F172A] border-r border-[#1E293B] transition-all duration-200 ${sidebarCollapsed ? "w-14" : "w-56"} shrink-0 print:hidden`}
      >
        <div
          className={`flex items-center gap-3 border-b border-[#1E293B] bg-gradient-to-b from-white/[0.02] to-transparent ${sidebarCollapsed ? "px-3 py-4 justify-center" : "px-4 py-4"}`}
        >
          <img src="/stock-management-logo.svg" alt="StockManager" className="w-8 h-8 shrink-0 rounded-lg" />
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                Stock<span className="font-medium text-white/90">Manager</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="uppercase tracking-[0.2em] text-[8px] font-bold text-[#6366F1]">
                  Enterprise
                </span>
                <span className="w-1 h-1 rounded-full bg-[#6366F1] animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {!sidebarCollapsed && group.label && (
                <p className="px-2 py-1 text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-100 relative
                      ${active ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#CBD5E1]"}
                      ${sidebarCollapsed ? "justify-center" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {item.badge && !sidebarCollapsed && (
                      <span className="ml-auto px-1.5 py-0.5 bg-[#DC2626] text-white text-[10px] rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                    {item.badge && sidebarCollapsed && (
                      <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#DC2626] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: settings & collapse */}
        <div className={`border-t border-[#1E293B] p-2 space-y-0.5`}>
          <button
            onClick={() => navigate("notifications")}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-100 relative
              ${screen === "notifications" ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#CBD5E1]"}
              ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <span className="shrink-0">{Icons.notifications}</span>
            {!sidebarCollapsed && <span>Notifications</span>}
            {unreadNotifications > 0 && (
              <span
                className={`${sidebarCollapsed ? "absolute top-0.5 right-0.5 w-4 h-4 text-[9px]" : "ml-auto px-1.5 py-0.5 text-[10px]"} bg-[#DC2626] text-white rounded-full flex items-center justify-center font-bold`}
              >
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("settings")}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-100
              ${screen === "settings" ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#CBD5E1]"}
              ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <span className="shrink-0">{Icons.settings}</span>
            {!sidebarCollapsed && "Settings"}
          </button>
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[#475569] hover:bg-[#1E293B] hover:text-[#94A3B8] transition-all duration-100 ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        {/* TOP NAV */}
        <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 shrink-0 print:hidden shadow-[0_1px_2px_0_rgb(0,0,0,0.03)]">
          <SearchBar
            value={globalSearch}
            onChange={setGlobalSearch}
            placeholder="Search anything..."
            className="w-64"
          />
          <div className="flex-1" />

          {/* Quick stats */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-[#94A3B8] border-r border-[#E2E8F0] pr-4 mr-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-[#16A34A]' : apiStatus === 'disconnected' ? 'bg-[#DC2626]' : 'bg-[#D97706] animate-pulse'}`} />
              {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'disconnected' ? 'Demo Mode' : 'Connecting...'}
            </span>
            <span>
              <span className="text-[#D97706] font-semibold">
                {lowStockCount}
              </span>{" "}
              low stock
            </span>
            <span>
              <span className="text-[#4F46E5] font-semibold">{pendingApprovals}</span> pending
            </span>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => navigate("notifications")}
            className="relative w-9 h-9 rounded-lg hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            {Icons.notifications}
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold flex items-center justify-center">
                {currentUser?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#1E293B] leading-none">
                  {currentUser?.fullName || "User"}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  {currentUser?.status || "User"}
                </p>
              </div>
              <svg
                className="w-3 h-3 text-[#94A3B8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-30 py-1 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#F1F5F9]">
                  <p className="text-xs font-semibold text-[#1E293B]">
                    {currentUser?.fullName || "User"}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    {currentUser?.email || "user@stockmanager.io"}
                  </p>
                </div>
                {[
                  {
                    label: "My profile",
                    icon: Icons.users,
                    action: () => navigate("settings"),
                  },
                  {
                    label: "Notifications",
                    icon: Icons.notifications,
                    action: () => navigate("notifications"),
                  },
                  {
                    label: "Settings",
                    icon: Icons.settings,
                    action: () => navigate("settings"),
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span className="text-[#94A3B8]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-[#F1F5F9] my-1" />
                <button
                  onClick={() => {
                    logout();
                    toast.success("Signed out successfully");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MAIN SCROLL AREA */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC] print:bg-white print:overflow-visible">
          <div className="p-6 max-w-[1400px] mx-auto min-h-full print:p-0 print:max-w-none">
            {screen === "dashboard" && <Dashboard />}
            {screen === "inventory" && <Inventory />}
            {screen === "suppliers" && <Suppliers />}
            {screen === "stock-receiving" && <StockReceiving />}
            {screen === "stock-issuing" && <StockIssuing />}
            {screen === "stock-transfer" && <StockTransfer />}
            {screen === "stock-tracking" && <StockTracking />}
            {screen === "stock-taking" && <StockTaking />}
            {screen === "users" && <Users />}
            {screen === "roles" && <RolesPermissions />}
            {screen === "reports" && <Reports />}
            {screen === "audit" && <AuditLog />}
            {screen === "notifications" && <Notifications />}
            {screen === "settings" && <Settings />}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
