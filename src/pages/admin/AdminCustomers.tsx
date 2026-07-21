import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Check,
  X,
  Key,
  Ban,
  Unlock,
  ShieldCheck,
  User,
  ShoppingBag,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Mail,
  Phone,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../../context/ToastContext";
import { adminUserService, AdminCustomer, AdminCustomerDetail } from "../../services/adminUserService";
import { Badge } from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Skeleton";

export const AdminCustomers: React.FC = () => {
  const { showToast } = useToast();

  // Core States
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDetail, setSelectedDetail] = useState<AdminCustomerDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "", "active", "suspended"
  const [sortBy, setSortBy] = useState<string>("newest"); // "newest", "oldest", "spentDesc", "ordersDesc"

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Password reset message state
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminUserService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load customers catalog", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter & Search Logic
  const filteredCustomers = customers.filter((cust) => {
    const fullName = `${cust.firstName || ""} ${cust.lastName || ""}` || cust.name || "";
    const email = cust.email || "";
    const phone = cust.phone || "";

    const matchesSearch =
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && cust.isActive) ||
      (statusFilter === "suspended" && !cust.isActive);

    return matchesSearch && matchesStatus;
  });

  // Sorting
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === "spentDesc") {
      return (b.totalSpent || 0) - (a.totalSpent || 0);
    }
    if (sortBy === "ordersDesc") {
      return (b.orderCount || 0) - (a.orderCount || 0);
    }
    return 0;
  });

  // Pagination Slice
  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedCustomers = sortedCustomers.slice((page - 1) * limit, page * limit);

  // View Customer Details
  const handleOpenDetail = async (id: string) => {
    try {
      const data = await adminUserService.getCustomerById(id);
      setSelectedDetail(data);
      setIsDetailOpen(true);
    } catch (err: any) {
      showToast(err.message || "Error fetching customer details", "error");
    }
  };

  // Toggle Suspended status
  const handleToggleStatus = async (cust: AdminCustomer) => {
    const nextActive = !cust.isActive;
    const actionLabel = nextActive ? "Restore Account" : "Suspend Account";
    if (!window.confirm(`Are you sure you want to perform ${actionLabel} on "${cust.firstName} ${cust.lastName}"?`)) return;

    try {
      await adminUserService.toggleUserStatus(cust.id || cust._id, nextActive);
      showToast(`Successfully toggled account status for ${cust.firstName}`, "success");
      loadCustomers();
      if (selectedDetail && (selectedDetail.customer.id === cust.id || selectedDetail.customer._id === cust._id)) {
        setSelectedDetail({
          ...selectedDetail,
          customer: { ...selectedDetail.customer, isActive: nextActive },
        });
      }
    } catch (err: any) {
      showToast(err.message || "Failed to toggle account suspension", "error");
    }
  };

  // Reset password
  const handleResetPassword = async (cust: AdminCustomer) => {
    if (!window.confirm(`Reset password for "${cust.firstName} ${cust.lastName}"? A temporary credentials link will be generated.`)) return;

    try {
      const tempPass = await adminUserService.resetUserPassword(cust.id || cust._id);
      setResetMsg(tempPass);
      setIsResetOpen(true);
      showToast("Password successfully reset", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to trigger password reset sequence", "error");
    }
  };

  // CSV Export Customers list
  const handleExportCSV = () => {
    const headers = ["First Name,Last Name,Email,Phone,Role,Orders Count,Total Spent,CreatedDate,Active\n"];
    const rows = customers.map((c) => {
      return `"${c.firstName || ""}","${c.lastName || ""}","${c.email}","${c.phone || ""}","${c.role}","${c.orderCount || 0}","${c.totalSpent || 0}","${c.createdAt}","${c.isActive ? "TRUE" : "FALSE"}"`;
    });
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Customers_Export_${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Temporary key copied to clipboard!", "success");
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Accounts Directory</h1>
          <p className="text-xs text-slate-500 font-medium">Verify buyer profiles, order frequencies, and spend patterns</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV Directory
        </button>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* SEARCH BAR */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          />
        </div>

        {/* ACCOUNT STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Account Statuses</option>
          <option value="active">Active Accounts</option>
          <option value="suspended">Suspended Accounts</option>
        </select>

        {/* CUSTOMER SORTING */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="newest">Registration: Newest First</option>
          <option value="oldest">Registration: Oldest First</option>
          <option value="spentDesc">Cumulative Spent: High to Low</option>
          <option value="ordersDesc">Order Volume: High to Low</option>
        </select>
      </div>

      {/* CUSTOMERS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Details</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact details</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Role</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Purchases</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Spent</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="p-4 flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-3.5 w-28" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-8" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-24 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No customers match current directory filter rules.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const initial = (cust.firstName?.[0] || cust.lastName?.[0] || cust.name?.[0] || "?").toUpperCase();

                  return (
                    <tr key={cust.id || cust._id} className="hover:bg-slate-50/50 transition-all duration-150">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-black shrink-0 border border-slate-200">
                            {initial}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-900">
                              {cust.firstName || cust.name ? `${cust.firstName || ""} ${cust.lastName || ""}`.trim() : "Guest account"}
                            </span>
                            {cust.isVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-500 font-mono">
                                <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 font-mono">UNVERIFIED</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-[11px] text-slate-500 font-semibold gap-0.5">
                          <span className="text-slate-800 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {cust.email}
                          </span>
                          {cust.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {cust.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600">
                        {new Date(cust.createdAt || Date.now()).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md border ${
                          cust.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {cust.role}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-900">{cust.orderCount || 0} checkouts</td>
                      <td className="p-4 text-xs font-black text-slate-950">${(cust.totalSpent || 0).toFixed(2)}</td>
                      <td className="p-4">
                        {cust.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Suspended</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(cust.id || cust._id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-950 transition-all"
                            title="View customer profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(cust)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-950 transition-all"
                            title="Reset password credential"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(cust)}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 transition-all ${
                              cust.isActive ? "text-slate-500 hover:text-red-600" : "text-emerald-600 hover:text-emerald-700"
                            }`}
                            title={cust.isActive ? "Suspend Account" : "Unban Account"}
                          >
                            {cust.isActive ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION ROWS */}
        {!loading && totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              Showing {paginatedCustomers.length} of {totalItems} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const isCurrent = idx + 1 === page;
                return (
                  <button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    className={`w-9.5 h-9.5 text-xs font-bold rounded-lg transition-all ${
                      isCurrent
                        ? "bg-slate-950 text-white shadow-sm"
                        : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAILED PROFILE DIALOG */}
      <AnimatePresence>
        {isDetailOpen && selectedDetail && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Container body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
              >
                {/* Header profile details */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-800">
                      {(selectedDetail.customer.firstName?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedDetail.customer.firstName} {selectedDetail.customer.lastName}
                      </h2>
                      <span className="block text-[11px] text-slate-400 font-bold">
                        Customer Account ID: {selectedDetail.customer._id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Grid profile statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account detail card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Account Profile
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 font-semibold">
                      <div className="flex justify-between">
                        <span>Role Status</span>
                        <span className="text-slate-900 capitalize font-extrabold">{selectedDetail.customer.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status</span>
                        {selectedDetail.customer.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Suspended</Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>Joined</span>
                        <span className="text-slate-950 font-bold">
                          {new Date(selectedDetail.customer.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Orders volumes spent card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      Fulfillment Logs
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 font-semibold">
                      <div className="flex justify-between">
                        <span>Orders processed</span>
                        <span className="text-slate-900 font-extrabold">{selectedDetail.orders?.length || 0} checkouts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cumulative Spent</span>
                        <span className="text-slate-950 font-extrabold">${(selectedDetail.customer.totalSpent || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Addresses info card */}
                  <div className="p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50 pb-1.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      Saved Addresses
                    </div>
                    <div className="text-xs space-y-1 text-slate-600 font-semibold max-h-[100px] overflow-y-auto">
                      {selectedDetail.customer.addresses && selectedDetail.customer.addresses.length > 0 ? (
                        selectedDetail.customer.addresses.map((addr, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-[10px] mb-1 leading-relaxed">
                            <strong>{addr.addressType || "Address"}:</strong> {addr.addressLine1}, {addr.city}, {addr.postalCode}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-center font-bold text-[10px] uppercase py-4">No saved addresses</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PURCHASE ORDER HISTORIES */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Order Transactions</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="p-3">Order Number</th>
                          <th className="p-3">Fulfillment Status</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3 text-right">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                        {selectedDetail.orders && selectedDetail.orders.length > 0 ? (
                          selectedDetail.orders.map((order, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="p-3 font-mono font-bold text-slate-900">
                                #{order.orderNumber || order._id.substring(18)}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                  order.status === "delivered" ? "bg-green-50 text-green-700 border border-green-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                  order.paymentStatus === "paid" ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                }`}>
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-900 font-extrabold">${order.total?.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wide">
                              No historic checkouts found for this profile.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL BOTTOM BAR */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => handleResetPassword(selectedDetail.customer)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Close Profile View
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {isResetOpen && resetMsg && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6"
              >
                <div className="text-center space-y-2">
                  <Key className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Credential Successfully Reset</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Provide the following secure random placeholder password to the client immediately.
                  </p>
                </div>

                {/* Password display container */}
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between gap-3 font-mono text-sm font-bold text-amber-950 text-center select-all">
                  <span className="truncate">{resetMsg.replace("Password successfully reset to ", "")}</span>
                  <button
                    onClick={() => handleCopyClipboard(resetMsg.replace("Password successfully reset to ", ""))}
                    className="p-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 transition-all shrink-0"
                    title="Copy temporary password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setIsResetOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
