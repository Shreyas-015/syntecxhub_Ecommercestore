import React from "react";
import { useCart } from "../hooks/useCart";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles, Bookmark, MapPin, Percent } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export const Cart: React.FC = () => {
  const { 
    cart, 
    savedForLater,
    removeFromCart, 
    updateQuantity, 
    cartTotal, 
    cartItemsCount,
    moveToSaveForLater,
    moveToCart,
    removeFromSaveForLater,
    shippingCost,
    tax,
    shippingDestination,
    setShippingDestination,
    taxRegion,
    setTaxRegion,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      showToast("Please authenticate to complete checkout.", "info");
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  const finalTotal = Math.max(0, cartTotal - discount + shippingCost + tax);

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="space-y-2 text-center max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Interactive Basket</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Your Shopping Cart
            </h1>
            <p className="text-xs text-slate-400">
              Review items selected for physical dispatch. Free delivery on orders over $150.
            </p>
          </div>

          {(cart.length > 0 || savedForLater.length > 0) ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Cart Items List */}
              <div className="space-y-4 lg:col-span-2">
                {cart.length > 0 ? (
                  cart.map((item, idx) => {
                    const product = item.product;
                    const price = product.discountPrice || product.price;

                    return (
                      <div 
                        key={`${product.id}-${item.selectedSize || ""}-${item.selectedColor || ""}-${idx}`}
                        className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-5 shadow-xs hover:border-slate-200 transition-all"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-0.5 flex-shrink-0">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center sm:text-left space-y-1 w-full">
                          <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                            {product.brand}
                          </p>
                          <h3 className="font-extrabold text-slate-800 text-sm font-display hover:text-blue-600 transition-colors">
                            <Link to={`/product/${product.id}`}>{product.name}</Link>
                          </h3>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500 font-bold">
                            {item.selectedColor && (
                              <span className="flex items-center gap-1">
                                <span>Color:</span>
                                <span className="text-slate-700">{item.selectedColor}</span>
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="flex items-center gap-1">
                                <span>Size:</span>
                                <span className="text-slate-700">{item.selectedSize}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions & Pricing */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 justify-between w-full sm:w-auto">
                          
                          {/* Quantity controls */}
                          <div className="flex items-center border border-slate-100 rounded-xl overflow-hidden bg-slate-50 p-1">
                            <button
                              onClick={() => updateQuantity(product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3.5 text-xs font-bold text-slate-800 font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Cost & Delete / Save For Later */}
                          <div className="flex items-center gap-4">
                            <div className="text-right sm:min-w-20">
                              <p className="text-xs font-black text-slate-900">${(price * item.quantity).toFixed(2)}</p>
                              {item.quantity > 1 && (
                                <p className="text-[9px] text-slate-400 font-mono font-bold">${price.toFixed(2)} each</p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => moveToSaveForLater(product.id)}
                              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Save for Later"
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                removeFromCart(product.id, item.selectedSize, item.selectedColor);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Your active basket is empty.</p>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs space-y-6">
                <h3 className="font-extrabold text-slate-900 font-display text-base pb-3 border-b border-slate-100">
                  Value Breakdown
                </h3>

                {/* Shipping & Tax Estimators */}
                <div className="space-y-4 pt-1 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Estimate Shipping</span>
                    </label>
                    <input
                      type="text"
                      value={shippingDestination}
                      onChange={(e) => setShippingDestination(e.target.value)}
                      placeholder="Enter city, state or ZIP"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:border-blue-400 font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider">
                      Tax Region Code
                    </label>
                    <select
                      value={taxRegion}
                      onChange={(e) => setTaxRegion(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:border-blue-400 font-medium transition-all"
                    >
                      <option value="">Default Retail Tax (5%)</option>
                      <option value="CA">California Sales Tax (8.25%)</option>
                      <option value="NY">New York Sales Tax (8.875%)</option>
                      <option value="TX">Texas Sales Tax (6.25%)</option>
                      <option value="IN">GST Tax (18%)</option>
                    </select>
                  </div>
                </div>

                {/* Coupon promo input */}
                <div className="space-y-1.5 pt-1 pb-4 border-b border-slate-100">
                  <label className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    <span>Promotional Coupon</span>
                  </label>
                  {!couponCode ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const code = formData.get("coupon") as string;
                        if (code) {
                          const success = await applyCoupon(code);
                          if (success) {
                            e.currentTarget.reset();
                          }
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        name="coupon"
                        placeholder="e.g. SYNTEX10, SECURE50"
                        className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:border-blue-400 font-medium font-mono uppercase"
                      />
                      <Button type="submit" variant="secondary" className="px-4 text-xs font-bold py-2.5">
                        Apply
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs">
                      <span className="font-mono font-bold text-emerald-700">{couponCode} Active</span>
                      <button
                        onClick={removeCoupon}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 text-xs font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Selected items count</span>
                    <span className="font-mono font-bold text-slate-700">{cartItemsCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Basket Subtotal</span>
                    <span className="font-mono font-bold text-slate-700">${cartTotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount</span>
                      <span className="font-mono font-bold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Express Logistics Fee</span>
                    <span className="font-mono font-bold text-slate-700">
                      {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Regional Tax</span>
                    <span className="font-mono font-bold text-slate-700">${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between text-sm font-black text-slate-900">
                    <span>Grand Checkout Total</span>
                    <span className="font-mono font-extrabold text-blue-600">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      className="w-full py-3.5 text-xs font-bold"
                      onClick={handleCheckout}
                      icon={<ShieldCheck className="w-4.5 h-4.5" />}
                    >
                      Proceed to Cryptographic Checkout
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Payments processed through local ledger sandboxing protocols. Client safety guaranteed.</span>
                </div>
              </div>

              {/* Save For Later Section */}
              {savedForLater.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-200/60 lg:col-span-3">
                  <h2 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-indigo-500" />
                    Saved For Later ({savedForLater.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {savedForLater.map((item, idx) => {
                      const product = item.product;
                      const price = product.discountPrice || product.price;

                      return (
                        <div 
                          key={`sfl-${product.id}-${idx}`}
                          className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center gap-4 shadow-xs"
                        >
                          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs truncate">
                              <Link to={`/product/${product.id}`}>{product.name}</Link>
                            </h4>
                            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">${price.toFixed(2)}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => moveToCart(product.id)}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold hover:underline"
                              >
                                Move to Cart
                              </button>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <button
                                onClick={() => removeFromSaveForLater(product.id)}
                                className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 max-w-lg mx-auto space-y-5">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 font-display text-base">Your basket is currently empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Add custom sneaker designs, hardware coordinates, and outerwear to complete your inventory.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/shop">
                  <Button variant="primary" icon={<ArrowRight className="w-4.5 h-4.5" />}>
                    Explore Storefront
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};
