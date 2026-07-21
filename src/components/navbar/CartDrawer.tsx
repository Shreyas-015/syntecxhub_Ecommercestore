import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Trash2, ArrowRight, Minus, Plus, CreditCard, Sparkles } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { Button } from "../common/Button";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    clearCart,
  } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<"idle" | "processing" | "success">("idle");

  const handleCheckout = () => {
    setCheckoutStep("processing");
    setTimeout(() => {
      setCheckoutStep("success");
      clearCart();
    }, 1800);
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setCheckoutStep("idle");
    }, 300);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Slider Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Your Shopping Cart
                  </h2>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar">
                {checkoutStep === "idle" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-slate-800 font-semibold text-base font-sans">
                            Your cart is empty
                          </p>
                          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                            Fill your storefront container with premium products today.
                          </p>
                        </div>
                        <Button
                          onClick={closeDrawer}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item, idx) => {
                          const activePrice = item.product.discountPrice || item.product.price;
                          return (
                            <motion.div
                              layout
                              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${idx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-4 bg-slate-50/50 hover:bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors"
                            >
                              <div className="w-16 h-16 bg-white rounded-xl overflow-hidden p-1 flex-shrink-0 flex items-center justify-center border border-slate-100">
                                <img
                                  src={item.product.images[0]}
                                  alt=""
                                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold tracking-wider text-slate-400 font-mono uppercase">
                                  {item.product.brand}
                                </h4>
                                <h3 className="text-sm font-semibold text-slate-800 truncate">
                                  {item.product.name}
                                </h3>

                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {item.selectedSize && (
                                    <span className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">
                                      Size: {item.selectedSize}
                                    </span>
                                  )}
                                  {item.selectedColor && (
                                    <span className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">
                                      Color: {item.selectedColor}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mt-2.5">
                                  {/* Quantity Buttons */}
                                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden scale-90 origin-left">
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          item.product.id,
                                          item.quantity - 1,
                                          item.selectedSize,
                                          item.selectedColor
                                        )
                                      }
                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2.5 text-xs font-semibold text-slate-700 font-mono">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          item.product.id,
                                          item.quantity + 1,
                                          item.selectedSize,
                                          item.selectedColor
                                        )
                                      }
                                      className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="text-sm font-extrabold text-slate-800 font-display">
                                    ${activePrice * item.quantity}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.product.id,
                                    item.selectedSize,
                                    item.selectedColor
                                  )
                                }
                                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === "processing" && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-t-blue-600 border-blue-100 animate-spin" />
                    <div>
                      <p className="text-slate-800 font-semibold text-base font-sans">
                        Authorizing Checkout Session...
                      </p>
                      <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                        Encrypting credentials and generating simulated secure payment tokens...
                      </p>
                    </div>
                  </div>
                )}

                {checkoutStep === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-lg shadow-green-100 border border-green-100">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 font-display">
                        Order Simulated Successfully!
                      </h3>
                      <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
                        In Phase 2, this checkout transaction will integrate directly with your Node/Express backend and Razorpay API.
                      </p>
                    </div>
                    <Button onClick={closeDrawer} variant="primary" className="mt-2">
                      Done
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && checkoutStep === "idle" && (
                <div className="px-6 py-5 border-t border-slate-100 space-y-4 bg-slate-50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-green-600 font-semibold font-mono">FREE</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-semibold text-slate-800">Total Price</span>
                    <span className="text-2xl font-extrabold text-slate-900 font-display">
                      ${cartTotal}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleCheckout}
                      variant="primary"
                      className="w-full text-sm font-semibold justify-center py-3"
                      icon={<CreditCard className="w-4 h-4" />}
                    >
                      Process Secure Checkout
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
