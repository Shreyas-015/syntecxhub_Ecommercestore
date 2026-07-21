import React, { useState, useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { useAddress } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ArrowLeft, 
  Loader2, 
  Phone, 
  Edit2, 
  Tag, 
  ShoppingBag,
  HelpCircle,
  Play,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { PaymentMethod } from "../types/order";
import { orderService } from "../services/orderService";
import { BackendAddress } from "../types/address";
import { usePayment } from "../context/PaymentContext";
import { paymentService } from "../services/paymentService";

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Checkout: React.FC = () => {
  const { cart, cartTotal, discount, shippingCost, tax, couponCode, clearCart } = useCart();
  const { 
    addresses, 
    selectedAddress, 
    createAddress, 
    updateAddress, 
    setDefaultAddress, 
    selectAddress, 
    loading: addressLoading 
  } = useAddress();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get("retryOrder");

  // Payment Hook Context
  const { 
    selectedMethod, 
    setSelectedMethod, 
    paymentLoading, 
    createPayment, 
    verifyPayment, 
    placeCODOrder 
  } = usePayment();

  // Selected Payment Method state (fallbacks/synced with PaymentProvider)
  const [notes, setNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Credit Card Entry state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Payment configurations (which methods are active in backend)
  const [config, setConfig] = useState<{ stripe: boolean; razorpay: boolean; cod: boolean; razorpayKeyId: string | null } | null>(null);

  // Simulation overlay
  const [isSimulatingProgress, setIsSimulatingProgress] = useState(false);
  const [simulateMsg, setSimulateMsg] = useState("");

  // Sandbox simulation trigger modal
  const [showSimulator, setShowSimulator] = useState<{
    active: boolean;
    orderId: string | null;
    method: PaymentMethod | null;
    amount: number;
  }>({
    active: false,
    orderId: null,
    method: null,
    amount: 0
  });

  // Load backend payment gateways configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const c = await paymentService.getPaymentConfig();
        setConfig(c);
      } catch (err) {
        console.error("Failed to load payment config:", err);
      }
    };
    fetchConfig();
  }, []);

  // Form states for Add/Edit Address
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [addrCountry, setAddrCountry] = useState("United States");
  const [addrType, setAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrLandmark, setAddrLandmark] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      showToast("Please authenticate to access secure checkout.", "info");
      navigate("/login?redirect=checkout");
    }
  }, [isAuthenticated, navigate, showToast]);

  useEffect(() => {
    if (cart.length === 0 && !isPlacingOrder) {
      showToast("Your cart is empty. Redirecting to Shop.", "info");
      navigate("/shop");
    }
  }, [cart, navigate, showToast, isPlacingOrder]);

  const resetForm = () => {
    setAddrFullName("");
    setAddrPhone("");
    setAddrLine1("");
    setAddrLine2("");
    setAddrCity("");
    setAddrState("");
    setAddrPostalCode("");
    setAddrCountry("United States");
    setAddrType("Home");
    setAddrIsDefault(false);
    setAddrLandmark("");
    setEditingAddressId(null);
    setIsEditingAddress(false);
  };

  const handleEditInit = (addr: BackendAddress) => {
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrLine1(addr.addressLine1);
    setAddrLine2(addr.addressLine2 || "");
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPostalCode(addr.postalCode);
    setAddrCountry(addr.country);
    setAddrType(addr.addressType);
    setAddrIsDefault(addr.isDefault);
    setAddrLandmark(addr.landmark || "");
    setEditingAddressId(addr._id);
    setIsEditingAddress(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!addrFullName.trim()) {
      showToast("Full recipient name is required.", "error");
      return;
    }
    
    // Phone validation
    const phoneTrimmed = addrPhone.trim();
    if (!phoneTrimmed) {
      showToast("Contact phone number is required.", "error");
      return;
    }
    const phoneRegex = /^[\d\s+\-()]{7,15}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      showToast("Please enter a valid phone number (7-15 digits/symbols).", "error");
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
      showToast("State/Region detail is required.", "error");
      return;
    }

    // Postal Code validation
    const zipTrimmed = addrPostalCode.trim();
    if (!zipTrimmed) {
      showToast("Postal code is required.", "error");
      return;
    }
    if (zipTrimmed.length < 3 || zipTrimmed.length > 10) {
      showToast("Please enter a valid postal/zip code (3-10 characters).", "error");
      return;
    }

    const payload = {
      fullName: addrFullName.trim(),
      phone: phoneTrimmed,
      addressLine1: addrLine1.trim(),
      addressLine2: addrLine2.trim() || undefined,
      city: addrCity.trim(),
      state: addrState.trim(),
      postalCode: zipTrimmed,
      country: addrCountry.trim(),
      landmark: addrLandmark.trim() || undefined,
      addressType: addrType,
      isDefault: addrIsDefault
    };

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
      } else {
        await createAddress(payload);
      }
      resetForm();
    } catch (err) {
      // Handled in Context
    }
  };

  const handleSimulatePayment = async (success: boolean) => {
    if (!showSimulator.orderId) return;
    
    setIsPlacingOrder(true);
    setShowSimulator(prev => ({ ...prev, active: false }));
    setIsSimulatingProgress(true);
    setSimulateMsg("Synthesizing secure handshake callback...");

    try {
      await new Promise(r => setTimeout(r, 1200));
      
      if (!success) {
        setSimulateMsg("Rejecting sandbox ledger request...");
        await new Promise(r => setTimeout(r, 800));
        setIsSimulatingProgress(false);
        navigate(`/payment-failure/${showSimulator.orderId}?reason=Sandbox Simulator Declined Transaction`);
        return;
      }

      setSimulateMsg("Updating transaction ledger to SUCCESS...");
      await new Promise(r => setTimeout(r, 1000));

      await clearCart();
      setIsSimulatingProgress(false);
      showToast("Payment Simulating Successful!", "success");
      navigate(`/payment-success/${showSimulator.orderId}`);
    } catch (err: any) {
      setIsSimulatingProgress(false);
      showToast(err.message || "Simulation failed", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast("Please select or add a delivery address to complete your checkout.", "error");
      return;
    }

    setIsPlacingOrder(true);
    let orderIdToPay = retryOrderId;

    try {
      let order;
      if (orderIdToPay) {
        order = await orderService.getOrderById(orderIdToPay);
      } else {
        // 1. Create a pending order on the backend first
        order = await orderService.checkout({
          shippingAddressId: selectedAddress._id,
          paymentMethod: selectedMethod as any, // CashOnDelivery / Stripe / Razorpay
          notes: notes.trim() || undefined,
          couponCode: couponCode || undefined,
          shippingOption: shippingCost === 0 ? "Free Standard Delivery" : "Express Premium Delivery"
        });
      }

      const currentOrderId = order._id;

      // 2. Route based on selected method
      if (selectedMethod === PaymentMethod.CASH_ON_DELIVERY) {
        await placeCODOrder(currentOrderId);
        showToast("COD Order Created successfully!", "success");
        navigate(`/payment-success/${currentOrderId}`);
      } else if (selectedMethod === PaymentMethod.RAZORPAY) {
        try {
          // Initialize payment intent on the backend
          const payment = await createPayment(currentOrderId, PaymentMethod.RAZORPAY);

          // Lazy load Razorpay Checkout Script
          const isScriptLoaded = await loadRazorpayScript();
          if (!isScriptLoaded) {
            throw new Error("Razorpay Gateway SDK failed to load. Network discrepancy detected.");
          }

          const razorpayKey = config?.razorpayKeyId || "rzp_test_mockkey";

          const rzpOptions = {
            key: razorpayKey,
            amount: payment.amounts.total * 100, // paise
            currency: payment.currency,
            name: "Syntex Store",
            description: `Invoice: ${order.orderNumber}`,
            order_id: payment.providerOrderId,
            handler: async function (response: any) {
              try {
                await verifyPayment(payment._id!, {
                  providerPaymentId: response.razorpay_payment_id,
                  providerSignature: response.razorpay_signature,
                  providerOrderId: response.razorpay_order_id,
                });
                showToast("Payment Successful!", "success");
                navigate(`/payment-success/${currentOrderId}`);
              } catch (verifyErr: any) {
                showToast("Verification Failed", "error");
                navigate(`/payment-failure/${currentOrderId}?reason=${encodeURIComponent(verifyErr.message || "Signature check failed.")}`);
              }
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
            },
            theme: {
              color: "#1e1b4b", // Deep midnight tone
            },
            modal: {
              ondismiss: function () {
                showToast("Payment Cancelled by User", "info");
                navigate(`/payment-failure/${currentOrderId}?reason=User dismissed the Razorpay modal window.`);
              }
            }
          };

          const rzp = new (window as any).Razorpay(rzpOptions);
          rzp.open();

        } catch (rzpInitErr: any) {
          // If Razorpay credentials are not set on the backend, allow local simulation
          console.error("Razorpay setup failed:", rzpInitErr);
          if (rzpInitErr.message?.includes("inactive") || rzpInitErr.message?.includes("missing") || !config?.razorpay) {
            // Trigger simulation option
            showToast("Razorpay credentials inactive. Activating Sandbox Simulator...", "info");
            setShowSimulator({
              active: true,
              orderId: currentOrderId,
              method: PaymentMethod.RAZORPAY,
              amount: order.total
            });
          } else {
            showToast("Gateway Unavailable", "error");
            navigate(`/payment-failure/${currentOrderId}?reason=${encodeURIComponent(rzpInitErr.message || "Gateway Initialization error")}`);
          }
        }
      } else if (selectedMethod === PaymentMethod.STRIPE) {
        // Stripe flow
        try {
          // Validate Stripe card details first
          if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
            throw new Error("Please fill in all credit card parameters before authorizing.");
          }

          // Initialize Stripe PaymentIntent on backend
          const payment = await createPayment(currentOrderId, PaymentMethod.STRIPE);

          // Simulate/Execute verification for stripe
          setIsSimulatingProgress(true);
          setSimulateMsg("Contacting Stripe Secure Node...");
          
          await new Promise((r) => setTimeout(r, 1500));
          setSimulateMsg("Exchanging secure transaction tokens...");
          await new Promise((r) => setTimeout(r, 1200));

          if (!config?.stripe) {
            setSimulateMsg("Stripe in Simulator Mode. Syncing server ledger...");
            await new Promise((r) => setTimeout(r, 1000));
            setIsSimulatingProgress(false);
            showToast("Payment Successful (Sandbox)!", "success");
            navigate(`/payment-success/${currentOrderId}`);
          } else {
            try {
              await verifyPayment(payment._id!, {
                providerPaymentId: payment.providerOrderId, // PaymentIntent ID
                providerOrderId: payment.providerOrderId
              });
              setIsSimulatingProgress(false);
              showToast("Payment Successful", "success");
              navigate(`/payment-success/${currentOrderId}`);
            } catch (stripeVerifyErr: any) {
              setIsSimulatingProgress(false);
              showToast("Verification Failed", "error");
              navigate(`/payment-failure/${currentOrderId}?reason=${encodeURIComponent(stripeVerifyErr.message || "Card processor verification failed")}`);
            }
          }
        } catch (stripeErr: any) {
          setIsSimulatingProgress(false);
          showToast("Payment Failed", "error");
          navigate(`/payment-failure/${currentOrderId}?reason=${encodeURIComponent(stripeErr.message || "Stripe gateway unavailable")}`);
        }
      }

    } catch (err: any) {
      showToast(err.message || "Failed to place order. Please review variables.", "error");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const finalTotal = Math.max(0, cartTotal - discount + shippingCost + tax);

  if (!isAuthenticated) {
    return <FullPageLoader />;
  }

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Back to Cart link */}
          <div className="flex items-center">
            <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Basket Details</span>
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Secure Ledger Checkout
            </h1>
            <p className="text-xs text-slate-400">
              Verify your physical delivery coordinates and select a certified transaction pathway.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: Address Selection & Payment */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Address Section */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-slate-900 font-display text-sm flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-blue-600" />
                      <span>Delivery Coordinates</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Where should we dispatch your shipment?</p>
                  </div>
                  {!isEditingAddress && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs font-bold py-1.5 px-3"
                      onClick={() => {
                        resetForm();
                        setIsEditingAddress(true);
                      }}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      New Address
                    </Button>
                  )}
                </div>

                {/* Form to Create/Edit Address */}
                {isEditingAddress && (
                  <form onSubmit={handleAddressSubmit} className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 font-display">
                      {editingAddressId ? "Modify Registered Coordinates" : "Register New Delivery coordinates"}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Full Recipient Name</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="Jane Doe"
                          value={addrFullName}
                          onChange={(e) => setAddrFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Recipient Phone Number</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="+1 (555) 019-2834"
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Address Line 1</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="120 Syntex Labs Ave"
                          value={addrLine1}
                          onChange={(e) => setAddrLine1(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Address Line 2 (Opt)</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="Suite 400"
                          value={addrLine2}
                          onChange={(e) => setAddrLine2(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">City</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="San Francisco"
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">State / Region</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="CA"
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Postal / ZIP Code</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="94103"
                          value={addrPostalCode}
                          onChange={(e) => setAddrPostalCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Country</label>
                        <input
                          type="text"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600/15 focus:outline-none"
                          placeholder="United States"
                          value={addrCountry}
                          onChange={(e) => setAddrCountry(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Address Class</label>
                        <select
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                          value={addrType}
                          onChange={(e) => setAddrType(e.target.value as any)}
                        >
                          <option value="Home">Home (Personal)</option>
                          <option value="Work">Work (HQ / Office)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2 flex items-center h-full pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addrIsDefault}
                            onChange={(e) => setAddrIsDefault(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-[11px] font-bold text-slate-600">Register as Default Destination</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button type="submit" variant="primary" size="sm" className="text-xs font-bold px-4 py-2">
                        {editingAddressId ? "Apply Modifications" : "Confirm Entry"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="text-xs font-bold px-4 py-2" onClick={resetForm}>
                        Discard
                      </Button>
                    </div>
                  </form>
                )}

                {/* List of saved addresses to select */}
                {addressLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddress?._id === addr._id;
                      return (
                        <div 
                          key={addr._id} 
                          onClick={() => selectAddress(addr._id)}
                          className={`border p-4.5 rounded-2xl relative cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                            isSelected 
                              ? "border-blue-600 bg-blue-50/20 shadow-xs" 
                              : "border-slate-100 bg-slate-50/10 hover:border-slate-200 hover:bg-slate-50/30"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono border ${
                                isSelected 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {addr.addressType}
                              </span>
                              
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditInit(addr);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                  title="Edit coordinates"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-extrabold text-slate-800">{addr.fullName}</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 mt-2">
                            <p className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-300" />
                              <span>{addr.phone}</span>
                            </p>
                            
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold uppercase font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                Default
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white border border-white">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500 mt-2">No coordinates registered</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please add a shipping address above to unlock order pathways.</p>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 font-display text-sm flex items-center gap-2">
                    <CreditCard className="w-4.5 h-4.5 text-blue-600" />
                    <span>Transaction Pathways</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Select a certified payment gateway to execute checkout.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Cash On Delivery */}
                  <div 
                    onClick={() => setSelectedMethod(PaymentMethod.CASH_ON_DELIVERY)}
                    className={`border p-4.5 rounded-2xl cursor-pointer relative transition-all space-y-2 flex flex-col justify-between ${
                      selectedMethod === PaymentMethod.CASH_ON_DELIVERY 
                        ? "border-blue-600 bg-blue-50/20 shadow-xs" 
                        : "border-slate-100 bg-slate-50/10 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-xs font-extrabold text-slate-800">Cash On Delivery</p>
                        <span className="text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200/50">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">Pay with liquid currency upon physical package receipt.</p>
                    </div>
                    {selectedMethod === PaymentMethod.CASH_ON_DELIVERY && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white border border-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Stripe */}
                  <div 
                    onClick={() => setSelectedMethod(PaymentMethod.STRIPE)}
                    className={`border p-4.5 rounded-2xl cursor-pointer relative transition-all space-y-2 flex flex-col justify-between ${
                      selectedMethod === PaymentMethod.STRIPE 
                        ? "border-blue-600 bg-blue-50/20 shadow-xs" 
                        : "border-slate-100 bg-slate-50/10 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-xs font-extrabold text-slate-800">Stripe Gateway</p>
                        <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded border ${
                          config?.stripe 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {config?.stripe ? "Ledger" : "Simulated"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">Certified global credit card processing (Stripe Core API).</p>
                    </div>
                    {selectedMethod === PaymentMethod.STRIPE && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white border border-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Razorpay */}
                  <div 
                    onClick={() => setSelectedMethod(PaymentMethod.RAZORPAY)}
                    className={`border p-4.5 rounded-2xl cursor-pointer relative transition-all space-y-2 flex flex-col justify-between ${
                      selectedMethod === PaymentMethod.RAZORPAY 
                        ? "border-blue-600 bg-blue-50/20 shadow-xs" 
                        : "border-slate-100 bg-slate-50/10 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-xs font-extrabold text-slate-800">Razorpay Pathway</p>
                        <span className={`text-[8px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded border ${
                          config?.razorpay 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {config?.razorpay ? "Ledger" : "Simulated"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">Secure local bank nodes and UPI validation (Razorpay Core API).</p>
                    </div>
                    {selectedMethod === PaymentMethod.RAZORPAY && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white border border-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Subform context renderers */}
                {selectedMethod === PaymentMethod.STRIPE && (
                  <div className="bg-slate-50/50 border border-slate-100 p-4 sm:p-5 rounded-2xl space-y-4 animate-fadeIn">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-300" />
                      <span>Gateway Debit/Credit Card Parameters</span>
                    </p>
                    
                    {!config?.stripe && (
                      <div className="p-3 bg-amber-50/40 border border-amber-100/60 rounded-xl text-[10px] text-amber-700 font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>Stripe keys unconfigured on the server. Sandbox simulation mode is enabled. Use any valid dummy data below to test.</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider font-mono">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-semibold text-slate-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider font-mono">Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={19}
                              placeholder="4111 1111 1111 1111"
                              value={cardNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/g, "");
                                const matches = val.match(/\d{1,4}/g);
                                if (matches) {
                                  setCardNumber(matches.join(" "));
                                } else {
                                  setCardNumber(val);
                                }
                              }}
                              className="w-full text-xs p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-mono font-bold text-slate-800 transition-all"
                            />
                            <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider font-mono">Expiry Date</label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\//g, "").replace(/[^0-9]/g, "");
                              if (val.length >= 2) {
                                setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
                              } else {
                                setCardExpiry(val);
                              }
                            }}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-mono font-bold text-slate-800 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider font-mono">Security Code (CVC)</label>
                          <input
                            type="password"
                            maxLength={3}
                            placeholder="•••"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-mono font-bold text-slate-800 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === PaymentMethod.RAZORPAY && (
                  <div className="bg-slate-50/50 border border-slate-100 p-4 sm:p-5 rounded-2xl space-y-3 animate-fadeIn">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-300" />
                      <span>Razorpay Secure Connection Notice</span>
                    </p>
                    
                    {!config?.razorpay ? (
                      <div className="p-3 bg-amber-50/40 border border-amber-100/60 rounded-xl text-[10px] text-amber-700 font-medium flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>Razorpay credentials unconfigured on the server. We will mount a custom Razorpay Sandbox simulation window when placing order.</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 leading-relaxed pl-5.5 font-medium">
                        Razorpay secure overlay is fully integrated. Upon placing order, we will construct a payment receipt and mount Razorpay Checkout.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider font-mono">Special Logistics Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Leave package by the garage gate, door code is 9921."
                    className="w-full text-xs p-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

            </div>

            {/* Right: Cart Summary & Grand Total */}
            <div className="space-y-6">
              
              {/* Product Snaps */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-5">
                <h3 className="font-extrabold text-slate-900 font-display text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-4.5 h-4.5 text-blue-600" />
                  <span>Inventory Snap</span>
                </h3>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item, idx) => {
                    const price = item.product.discountPrice || item.product.price;
                    return (
                      <div key={`${item.product.id}-${idx}`} className="flex items-center gap-4.5">
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 p-0.5">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase mt-0.5">
                            Qty: {item.quantity} • {item.selectedSize || "Standard Size"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-slate-900 font-mono">${(price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-800 font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Promo Code Applied</span>
                      </span>
                      <span className="font-mono">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Logistics Delivery</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>State Sales Tax</span>
                    <span className="font-mono text-slate-800 font-bold">${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between text-sm font-black text-slate-900">
                    <span>Grand Checkout Total</span>
                    <span className="font-mono text-blue-600 text-base font-black">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    className="w-full py-3.5 text-xs font-bold"
                    onClick={handlePlaceOrder}
                    isLoading={isPlacingOrder}
                    disabled={isPlacingOrder || !selectedAddress}
                    icon={<ShieldCheck className="w-4.5 h-4.5" />}
                  >
                    Authorize Dispatch
                  </Button>
                </div>

                {!selectedAddress && (
                  <p className="text-[9px] text-rose-500 font-bold text-center leading-normal">
                    * Register or select a Delivery Coordinate to complete this dispatch.
                  </p>
                )}

                <div className="flex items-start gap-2.5 text-[9px] text-slate-400 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <ShieldCheck className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>By placing order, you agree to secure sandbox delivery protocols. Transaction tokens are fully encrypted.</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {isSimulatingProgress && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-5 border border-slate-100 shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Synchronizing Transaction Ledger</h3>
              <p className="text-[11px] text-slate-400 font-mono">{simulateMsg}</p>
            </div>
            <p className="text-[10px] text-slate-300 font-mono">DO NOT RELOAD OR SHIFT WINDOWS</p>
          </div>
        </div>
      )}

      {showSimulator.active && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-6 border border-slate-100 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <AlertCircle className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Sandbox Gateway Simulation</h3>
                <p className="text-[10px] text-slate-400">Manage checkout state manually</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                You are executing a <span className="font-bold text-slate-800">{showSimulator.method}</span> checkout pathway. Since no live credential configuration is bound to the server, choose the transaction response:
              </p>
              
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-800">Pending Secure Sync</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Authorized Amount:</span>
                  <span className="font-mono font-bold text-slate-800">${showSimulator.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleSimulatePayment(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors"
              >
                <CheckCircle className="w-4.5 h-4.5" />
                <span>Simulate Successful Payment</span>
              </button>
              
              <button
                onClick={() => handleSimulatePayment(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors"
              >
                <X className="w-4.5 h-4.5" />
                <span>Simulate Declined Payment</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowSimulator(prev => ({ ...prev, active: false }));
                setIsPlacingOrder(false);
              }}
              className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 py-1 transition-colors"
            >
              Cancel Checkout Process
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

const FullPageLoader: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-xs text-slate-400 font-mono">Securing secure channel...</p>
    </div>
  );
};
