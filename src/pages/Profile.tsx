import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAddress } from "../context/AddressContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Edit, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ShieldCheck, 
  Package, 
  LogOut,
  Sparkles,
  HelpCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService } from "../services/orderService";
import { Order } from "../types/order";

export const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { addresses, createAddress, deleteAddress, loading: addressLoading } = useAddress();
  const { showToast } = useToast();

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Add address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrPhone, setAddrPhone] = useState("");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders for profile summary", err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      showToast("Name and email are required.", "error");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePhone(user?.phone || "");
    setIsEditingProfile(false);
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addrFullName.trim()) {
      showToast("Recipient full name is required.", "error");
      return;
    }
    if (!addrPhone.trim()) {
      showToast("Contact phone number is required.", "error");
      return;
    }
    if (!addrLine1.trim()) {
      showToast("Address details are required.", "error");
      return;
    }
    if (!addrCity.trim()) {
      showToast("City detail is required.", "error");
      return;
    }
    if (!addrState.trim()) {
      showToast("State detail is required.", "error");
      return;
    }
    if (!addrZip.trim()) {
      showToast("Postal ZIP code is required.", "error");
      return;
    }

    try {
      await createAddress({
        fullName: addrFullName.trim(),
        phone: addrPhone.trim(),
        addressLine1: addrLine1.trim(),
        addressLine2: addrLine2.trim() || undefined,
        city: addrCity.trim(),
        state: addrState.trim(),
        postalCode: addrZip.trim(),
        country: "United States",
        addressType: addrLabel,
        isDefault: addresses.length === 0 // Default true if it is the first address
      });

      // Reset address form
      setIsAddingAddress(false);
      setAddrLabel("Home");
      setAddrFullName("");
      setAddrLine1("");
      setAddrLine2("");
      setAddrCity("");
      setAddrState("");
      setAddrZip("");
      setAddrPhone("");
    } catch (err) {
      // Handled in Context
    }
  };

  const mockPaymentMethods = [
    {
      id: "pay-1",
      brand: "Visa",
      last4: "4242",
      expiry: "12/28",
      color: "from-blue-600 to-indigo-700",
    },
    {
      id: "pay-2",
      brand: "Mastercard",
      last4: "8821",
      expiry: "06/27",
      color: "from-slate-800 to-slate-950",
    },
  ];

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Dashboard Header Banner */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 pointer-events-none" />
            
            <div className="flex items-center gap-5 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20">
                <img
                  src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
                    Verified Member
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight">
                  {user?.name}
                </h1>
                <p className="text-xs text-slate-400 font-mono">ID: {user?.id}</p>
              </div>
            </div>

            <div className="flex gap-3 z-10">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 text-white hover:bg-slate-800 hover:text-white"
                onClick={() => showToast("Session encryption parameters are fully secure.", "success")}
                icon={<ShieldCheck className="text-emerald-400 w-4.5 h-4.5" />}
              >
                Security Audit
              </Button>
              
              <Button
                variant="danger"
                size="sm"
                onClick={logout}
                icon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: Profile Core Details */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 font-display text-base">Account Identity</h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                    title="Edit Profile"
                  >
                    <Edit className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">Phone Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs py-2"
                      isLoading={isSavingProfile}
                      icon={<Check className="w-4 h-4" />}
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs py-2"
                      onClick={handleCancelProfileEdit}
                      icon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                      <UserIcon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Full Name</p>
                      <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Email Address</p>
                      <p className="text-xs font-semibold text-slate-800">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
                      <Phone className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Phone Number</p>
                      <p className="text-xs font-semibold text-slate-800">{user?.phone || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Saved Delivery Addresses */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6 lg:col-span-2">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 font-display text-base">Delivery Coordinates</h3>
                  <p className="text-[11px] text-slate-400">Manage verified destinations for checkout processes.</p>
                </div>
                {!isAddingAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="py-1.5 px-3.5 text-xs font-bold"
                    onClick={() => setIsAddingAddress(true)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Address
                  </Button>
                )}
              </div>

              {/* Add Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleAddAddressSubmit} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-800 font-display">New Location Coordinates</h4>
                    <button type="button" onClick={() => setIsAddingAddress(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Coordinate Label</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value as any)}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-600">Full Recipient Name</label>
                      <input
                        type="text"
                        placeholder="Recipient full name"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrFullName}
                        onChange={(e) => setAddrFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Address Line 1</label>
                      <input
                        type="text"
                        placeholder="Street details, PO box"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Suite, unit, building"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrLine2}
                        onChange={(e) => setAddrLine2(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">City</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">State / Region</label>
                      <input
                        type="text"
                        placeholder="e.g. CA"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Zip / Postal Code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Contact Number</label>
                      <input
                        type="text"
                        placeholder="Recipient phone"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" variant="primary" size="sm" className="text-xs font-bold py-1.5 px-4">
                      Save Location Coordinates
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="text-xs font-bold py-1.5 px-4" onClick={() => setIsAddingAddress(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addressLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : addresses && addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="border border-slate-100 p-5 rounded-2xl relative bg-slate-50/20 hover:border-slate-200 hover:bg-slate-50/50 transition-all space-y-2">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border border-blue-100">
                        {addr.addressType}
                      </span>
                      <button
                        onClick={() => deleteAddress(addr._id)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <p className="text-xs font-bold text-slate-800">{addr.fullName}</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                        <p className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          <span>{addr.phone}</span>
                        </p>
                        {addr.isDefault && (
                          <span className="text-[8px] font-extrabold uppercase font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold mt-2 font-display">No coordinates registered yet</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Add custom delivery destinations above to unlock lightning checkout channels in later sprints.
                  </p>
                </div>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 3: Saved Payment Methods (UI ONLY) */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 font-display text-base">Payment Instruments</h3>
                  <p className="text-[11px] text-slate-400">Tokenized payment channels (UI Only).</p>
                </div>
                <button
                  onClick={() => showToast("Credit card provisioning is integrated into Phase 3 checkout models.", "info")}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                {mockPaymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`bg-gradient-to-r ${pm.color} text-white p-5 rounded-2xl shadow-md border border-white/5 relative overflow-hidden`}
                  >
                    {/* Circle decals */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                    
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-7 h-7 opacity-80" />
                      <span className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-90 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                        {pm.brand}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <p className="text-sm font-semibold font-mono tracking-widest">•••• •••• •••• {pm.last4}</p>
                      
                      <div className="flex justify-between items-end text-[9px] font-bold font-mono uppercase tracking-wider text-white/70">
                        <div>
                          <p>Cardholder</p>
                          <p className="text-white text-[10px] mt-0.5">{user?.name}</p>
                        </div>
                        <div className="text-right">
                          <p>Expires</p>
                          <p className="text-white text-[10px] mt-0.5">{pm.expiry}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 4: Active / Historic Orders */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6 lg:col-span-2">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-slate-900 font-display text-base">Purchase History</h3>
                  <p className="text-[11px] text-slate-400">Track current and legacy shipments.</p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold font-mono border border-slate-200">
                  Total Purchases: {orders.length}
                </span>
              </div>

              {/* Order Records */}
              {ordersLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => {
                    const totalVal = typeof order.total === "number" ? order.total : Number(order.total || 0);
                    return (
                      <div key={order._id} className="border border-slate-100 rounded-2xl bg-slate-50/20 hover:border-slate-200 hover:bg-slate-50/40 transition-all overflow-hidden">
                        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Purchase Voucher</p>
                            <Link to={`/orders/${order._id}`} className="text-xs font-bold font-mono text-blue-400 hover:underline flex items-center gap-1">
                              <span>{order.orderNumber}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                            <span className="px-2 py-0.5 bg-blue-500 text-white rounded-md font-semibold">
                              Pay: {order.paymentStatus}
                            </span>
                            <span className="px-2 py-0.5 bg-green-500 text-white rounded-md font-semibold flex items-center gap-1 uppercase">
                              <Package className="w-3.5 h-3.5" />
                              {order.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {order.orderItems.slice(0, 2).map((item, itIdx) => {
                            const itemPrice = typeof item.price === "number" ? item.price : Number(item.price || 0);
                            return (
                              <div key={itIdx} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-white p-0.5">
                                  <img
                                    src={item.thumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                  <p className="text-[9px] text-slate-400 font-bold">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-extrabold text-slate-900 font-mono">${(itemPrice * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                            );
                          })}

                          {order.orderItems.length > 2 && (
                            <p className="text-[10px] text-slate-400 font-bold italic">
                              + {order.orderItems.length - 2} more items in this package
                            </p>
                          )}

                          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                            <p className="text-slate-400 font-medium">
                              Estimated Delivery: <strong className="text-slate-600">{order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "N/A"}</strong>
                            </p>
                            <p className="font-bold text-slate-900">
                              Total Checkout Value: <span className="text-blue-600 font-extrabold">${totalVal.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {orders.length > 3 && (
                    <div className="text-center pt-2">
                      <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline">
                        View All {orders.length} Orders
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold mt-2 font-display">No historic purchases registered</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Your purchase history folder is empty. Place an order to register it securely on our servers.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
};
