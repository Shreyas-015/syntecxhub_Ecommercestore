import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  LineChart,
  FileText,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Search,
  User as UserIcon,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  isPlaceholder?: boolean;
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Categories", path: "/admin/categories", icon: Tag },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "Inventory", path: "/admin/inventory", icon: Boxes },
    { name: "Analytics", path: "/admin/analytics", icon: LineChart, isPlaceholder: true },
    { name: "Reports", path: "/admin/reports", icon: FileText, isPlaceholder: true },
    { name: "Settings", path: "/admin/settings", icon: SettingsIcon, isPlaceholder: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Generate dynamic breadcrumb trial
  const pathnames = location.pathname.split("/").filter((x) => x);
  const formatBreadcrumb = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
  };

  const activeItem = sidebarItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-slate-200/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* DESKTOP SIDEBAR - PERSISTENT */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen z-20">
        {/* LOGO AREA */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 bg-white">
          <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block">Syntex Store</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider font-mono">Control Center</span>
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3 font-mono">
            Management
          </div>
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.isPlaceholder ? "#" : item.path}
                onClick={(e) => {
                  if (item.isPlaceholder) {
                    e.preventDefault();
                    alert(`${item.name} module is coming soon! Please check the Admin Dashboard.`);
                  }
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-950 text-white shadow-sm shadow-slate-950/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span>{item.name}</span>
                </div>
                {item.isPlaceholder && (
                  <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-200 transition-colors">
                    Draft
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER USER AREA */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden shadow-inner">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate">{user?.name || "Administrator"}</span>
              <span className="block text-[10px] text-slate-400 truncate font-mono">{user?.email || "admin@syntex.com"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-30 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-40 flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 tracking-tight text-base block">Syntex Store</span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider font-mono">Control Center</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3 font-mono">
                  Management
                </div>
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.isPlaceholder ? "#" : item.path}
                      onClick={(e) => {
                        if (item.isPlaceholder) {
                          e.preventDefault();
                          alert(`${item.name} module is coming soon! Please check the Admin Dashboard.`);
                        } else {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.isPlaceholder && (
                        <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Draft
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-900 truncate">{user?.name || "Administrator"}</span>
                    <span className="block text-[10px] text-slate-400 truncate font-mono">{user?.email || "admin@syntex.com"}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger Toggle (Mobile/Tablet Only) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Trial */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span className="hover:text-slate-600 transition-colors">Admin</span>
              {pathnames.map((name, index) => {
                const isLast = index === pathnames.length - 1;
                return (
                  <React.Fragment key={name}>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className={isLast ? "text-slate-800 font-bold" : "hover:text-slate-600 transition-colors"}>
                      {formatBreadcrumb(name)}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile simplified header */}
            <div className="sm:hidden text-sm font-bold text-slate-900">
              {activeItem ? activeItem.name : "Admin Panel"}
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            {/* Placeholder Search */}
            <div className="hidden md:flex items-center relative w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Search administration..."
                className="w-full text-xs font-medium pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
              />
            </div>

            {/* Notification area with simple interactive dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className={`p-2 rounded-xl border transition-colors relative ${
                  isNotificationsOpen
                    ? "bg-slate-100 border-slate-300 text-slate-950"
                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
                aria-label="View Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase font-mono">2 unread</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                          <p className="text-xs font-bold text-slate-800 mb-0.5">Inventory warning: Out of stock</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                            "Ultralight Wireless Gaming Mouse" hit exactly 0 units in stock.
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 block">5 minutes ago</span>
                        </div>
                        <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                          <p className="text-xs font-bold text-slate-800 mb-0.5">High value order placed</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-1">
                            Order #STX-1025 was completed by Shreyas P ($1,250.00).
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 block">1 hour ago</span>
                        </div>
                      </div>
                      <div className="p-2.5 text-center bg-slate-50 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            alert("Notification center is coming soon in further releases!");
                          }}
                          className="text-xs font-bold text-slate-950 hover:text-slate-800 transition-colors block w-full"
                        >
                          View All Alerts
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-colors select-none ${
                  isProfileOpen
                    ? "bg-slate-100 border-slate-300 text-slate-950"
                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="w-7.5 h-7.5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : "A"
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-800 truncate max-w-20">
                  {user?.name ? user.name.split(" ")[0] : "Admin"}
                </span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20 p-2 space-y-1"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Administrator"}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email || "admin@syntex.com"}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out Safely
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* CONTENT ENVELOPE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
