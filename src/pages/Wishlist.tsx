import React from "react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../context/WishlistContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { WishlistSkeleton } from "../components/common/Skeleton";

export const Wishlist: React.FC = () => {
  const { addToCart } = useCart();
  const { products: wishlistedProducts, loading: isLoading, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  const handleMoveToCart = async (product: any) => {
    await addToCart(product, 1);
    await removeFromWishlist(product.id);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="bg-slate-50/50 flex-1 py-12">
          <WishlistSkeleton />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header */}
          <div className="space-y-2 text-center max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Saved Coordinates</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Your Wishlist
            </h1>
            <p className="text-xs text-slate-400">
              Review and manage elite items saved to your secure personal vault.
            </p>
          </div>

          {wishlistedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wishlistedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:border-slate-200 hover:shadow-md transition-all flex flex-col group relative"
                >
                  <button
                    onClick={() => {
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md text-rose-500 hover:text-rose-600 rounded-xl border border-slate-100 shadow-sm transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Thumbnail */}
                  <div className="aspect-4/3 overflow-hidden bg-slate-50 relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {product.discountPrice && (
                      <span className="absolute bottom-4 left-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        SAVE ${(product.price - product.discountPrice).toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                        {product.brand}
                      </p>
                      <h3 className="font-extrabold text-slate-800 text-sm font-display group-hover:text-blue-600 transition-colors">
                        <Link to={`/product/${product.id}`}>{product.name}</Link>
                      </h3>
                      <div className="flex items-center gap-2 pt-1">
                        {product.discountPrice ? (
                          <>
                            <span className="text-sm font-black text-slate-900">${product.discountPrice}</span>
                            <span className="text-xs text-slate-400 line-through">${product.price}</span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-slate-900">${product.price}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="flex-1 py-2 text-xs font-semibold"
                        onClick={() => handleMoveToCart(product)}
                        icon={<ShoppingBag className="w-4 h-4" />}
                      >
                        Add to Basket
                      </Button>
                      
                      <Link to={`/product/${product.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full py-2 text-xs font-semibold"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 max-w-lg mx-auto space-y-5">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 font-display text-base">Your vault is currently empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse our high-fidelity, polished catalog to bookmark premium electronics and design coordinates.
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
