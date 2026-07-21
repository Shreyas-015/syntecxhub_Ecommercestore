import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Heart, ShoppingBag, Eye } from "lucide-react";
import { Product } from "../../types";
import { useCart } from "../../hooks/useCart";
import { Badge } from "../common/Badge";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const wishlisted = isInWishlist(product.id);

  const discounted = product.discountPrice < product.price;
  const discountPercent = discounted
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative bg-white border border-slate-100/80 rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-100/80 hover:border-slate-200/50 transition-all duration-300"
    >
      {/* Top Meta & Badges */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5 items-start">
        {product.isNew && (
          <Badge variant="primary" className="shadow-sm">
            NEW
          </Badge>
        )}
        {discounted && (
          <Badge variant="danger" className="shadow-sm">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Wishlist Trigger */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-6 right-6 z-10 p-2.5 rounded-full border bg-white/90 backdrop-blur-xs shadow-sm hover:scale-105 active:scale-95 transition-all ${
          wishlisted
            ? "border-red-100 text-red-500 bg-red-50/80"
            : "border-slate-100 text-slate-400 hover:text-slate-600"
        }`}
      >
        <Heart className={`w-4.5 h-4.5 ${wishlisted ? "fill-red-500" : ""}`} />
      </button>

      {/* Product Image Section */}
      <Link to={`/product/${product.id}`} className="block relative h-52 w-full mb-4 overflow-hidden rounded-2xl bg-slate-50 flex items-center justify-center p-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className="max-h-full max-w-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Quick View Cover Overlay */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-3 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
        </div>
      </Link>

      {/* Product Information */}
      <div className="space-y-2.5">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
            {product.brand}
          </span>
          <Link to={`/product/${product.id}`} className="block">
            <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors font-sans mt-0.5">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Ratings and Count */}
        <div className="flex items-center gap-1">
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 ${
                  idx < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-700 font-sans ml-1">
            {product.rating}
          </span>
          <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
        </div>

        {/* Pricing & Cart Action */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900 font-display">
              ${product.discountPrice}
            </span>
            {discounted && (
              <span className="text-xs text-slate-400 line-through">
                ${product.price}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/10 hover:bg-blue-700 hover:shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
