import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../types";
import { X, Star, Heart, ShoppingBag, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!product) return null;

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.category === "shoes" ? "9" : product.category === "fashion" ? "M" : undefined
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.category === "electronics" ? "Space Black" : product.category === "fashion" ? "Camel" : undefined
  );

  const colors = ["Space Black", "Silver", "Camel", "Off-White"];
  const sizes = product.category === "shoes" ? ["8", "9", "10", "11"] : ["S", "M", "L", "XL"];

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setQuantity(1);
    onClose();
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-10 grid grid-cols-1 md:grid-cols-2"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Image Gallery */}
            <div className="relative p-6 md:p-8 bg-slate-50 flex flex-col justify-center items-center rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl border-r border-slate-100 min-h-[320px] md:min-h-[450px]">
              {product.isNew && (
                <Badge variant="primary" className="absolute top-6 left-6 z-10 shadow-sm">
                  NEW
                </Badge>
              )}
              {product.discountPrice < product.price && (
                <Badge variant="danger" className="absolute top-6 left-24 z-10 shadow-sm">
                  -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </Badge>
              )}

              {/* Main Image */}
              <div className="relative w-full h-64 md:h-80 flex items-center justify-center group overflow-hidden rounded-2xl">
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply transform transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md border border-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto py-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-12 h-12 rounded-lg p-0.5 border-2 bg-white flex-shrink-0 transition-all ${
                        selectedImageIndex === idx ? "border-blue-600 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">
                    {product.brand}
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-display mt-1">
                    {product.name}
                  </h2>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount} reviews)</span>
                </div>

                {/* Prices */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 font-display">
                    ${product.discountPrice}
                  </span>
                  {product.discountPrice < product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      ${product.price}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                  {product.description}
                </p>

                {/* Optional Configuration Options */}
                {(product.category === "shoes" || product.category === "fashion") && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Select Size
                    </span>
                    <div className="flex gap-2">
                      {sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            selectedSize === sz
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.category === "electronics" && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Select Color
                    </span>
                    <div className="flex gap-2">
                      {colors.slice(0, 3).map((col) => (
                        <button
                          key={col}
                          onClick={() => setSelectedColor(col)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                            selectedColor === col
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              col === "Space Black"
                                ? "bg-slate-900"
                                : col === "Silver"
                                ? "bg-slate-300"
                                : "bg-amber-100"
                            }`}
                          />
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Quantity</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-semibold text-slate-800 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    variant="primary"
                    className="flex-1"
                    icon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Add to Cart
                  </Button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      isInWishlist(product.id)
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-slate-200 hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-red-500" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
