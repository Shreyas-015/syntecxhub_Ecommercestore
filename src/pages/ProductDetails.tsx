import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, RefreshCw, ChevronLeft, ArrowLeft, Send } from "lucide-react";
import { ProductCard } from "../components/product/ProductCard";
import { QuickViewModal } from "../components/product/QuickViewModal";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { PageTransition } from "../components/common/PageTransition";
import { useCart } from "../hooks/useCart";
import { productService } from "../services/productService";
import { Product } from "../types";
import { ProductDetailsSkeleton } from "../components/common/Skeleton";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  // States
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Fetch product and related products
  useEffect(() => {
    let active = true;
    const loadProductDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedProduct = await productService.getProductById(id);
        if (!active) return;
        setProduct(fetchedProduct);
        
        // Fetch related products
        try {
          const relatedResponse = await productService.getProducts({
            category: fetchedProduct.category,
            limit: 5
          });
          if (active) {
            setRelatedProducts(
              relatedResponse.products.filter((p) => p.id !== fetchedProduct.id).slice(0, 4)
            );
          }
        } catch (err) {
          console.error("Failed to load related products:", err);
        }
      } catch (err: any) {
        console.error("Failed to fetch product details:", err);
        if (active) {
          setError(err.message || "Failed to load product");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadProductDetails();

    return () => {
      active = false;
    };
  }, [id]);

  // Reset product configuration on mount/id change
  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    setReviewSuccess(false);
    // Initialize with a few dummy reviews
    if (product) {
      setReviews([
        {
          id: "rev-1",
          userName: "Alexander Grant",
          userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          rating: 5,
          comment: `Exceeded all baseline criteria. The build quality of this ${product.brand} product is phenomenal. Highly recommended to anyone looking to level up.`,
          date: "July 15, 2026",
        },
        {
          id: "rev-2",
          userName: "Sophia Martinez",
          userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          rating: 4,
          comment: "Solid and reliable. Delivery took less than a day. Will purchase from Syntex Store again.",
          date: "July 11, 2026",
        },
      ]);
    }
  }, [product]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="bg-slate-50/50 flex-1 py-10">
          <ProductDetailsSkeleton />
        </div>
      </PageTransition>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold font-display">Product Configuration Not Found</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          The requested asset key does not exist or has been archived from Syntex's directory.
        </p>
        <Link to="/shop">
          <Button variant="primary">Return to Storefront</Button>
        </Link>
      </div>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const discounted = product.discountPrice < product.price;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewComment.trim() && newReviewName.trim()) {
      const newEntry = {
        id: `rev-${Date.now()}`,
        userName: newReviewName,
        userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        rating: newReviewRating,
        comment: newReviewComment,
        date: "Just now",
      };
      setReviews([newEntry, ...reviews]);
      setNewReviewName("");
      setNewReviewComment("");
      setNewReviewRating(5);
      setReviewSuccess(true);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          {/* Product Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm">
            
            {/* Gallery Left */}
            <div className="space-y-6">
              
              {/* Active Image Box */}
              <div className="relative h-80 sm:h-96 md:h-[450px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-6 overflow-hidden">
                <img
                  src={product.images[selectedImageIdx]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply transform transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  {product.isNew && <Badge variant="primary">NEW</Badge>}
                  {discounted && (
                    <Badge variant="danger">
                      -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails Row */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto py-1.5">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative w-20 h-20 bg-white border rounded-xl overflow-hidden p-1 flex-shrink-0 transition-all ${
                        selectedImageIdx === idx
                          ? "border-blue-600 shadow-sm"
                          : "border-slate-100 opacity-60 hover:opacity-100"
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

            {/* Product Meta details Right */}
            <div className="flex flex-col justify-between">
              <div className="space-y-6">
                
                <div>
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono">
                    {product.brand}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
                    {product.name}
                  </h1>
                </div>

                {/* Rating Bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < Math.floor(product.rating) ? "fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{product.rating}</span>
                  <span className="text-xs text-slate-400">({reviews.length + 42} global buyers)</span>
                </div>

                {/* Prices */}
                <div className="flex items-baseline gap-2 pb-6 border-b border-slate-100">
                  <span className="text-3xl font-extrabold text-slate-900 font-display">
                    ${product.discountPrice}
                  </span>
                  {discounted && (
                    <span className="text-sm text-slate-400 line-through">
                      ${product.price}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Bespoke Product Description
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Specifications Matrix */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    System Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-xs font-medium border border-slate-100/80">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <span className="text-slate-400 block uppercase font-mono text-[9px] font-bold tracking-wider">{key}</span>
                        <span className="text-slate-800 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Box */}
              <div className="pt-8 border-t border-slate-100 mt-8 space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">Configure Stock Volume</span>
                    <p className="text-[10px] text-slate-400 font-medium">In stock: {product.stock} units</p>
                  </div>
                  
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden w-fit">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-5 text-sm font-semibold text-slate-800 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddToCart}
                    variant="primary"
                    className="flex-1 py-3.5 text-sm font-semibold"
                    icon={<ShoppingBag className="w-5 h-5" />}
                  >
                    Add Items to Cart
                  </Button>
                  
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3.5 rounded-xl border transition-all ${
                      wishlisted
                        ? "border-red-200 bg-red-50 text-red-500 shadow-sm"
                        : "border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500" : ""}`} />
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Reviews Ledger & Client submission */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: Review Breakdown and Submission Form */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Customer Feedback</h3>
                <p className="text-xs text-slate-400 mt-1">Submit your verification logs for this product.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 font-sans">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 font-sans">Product Rating</label>
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starVal = idx + 1;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setNewReviewRating(starVal)}
                          className="hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${starVal <= newReviewRating ? "fill-amber-400" : "text-slate-200"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 font-sans">Comments / Feedback</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your verification comment here..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 font-sans"
                  />
                </div>

                {reviewSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-medium border border-green-100">
                    🎉 Feedback posted and recorded in standard client-side state successfully!
                  </div>
                )}

                <Button type="submit" variant="primary" className="w-full" icon={<Send className="w-3.5 h-3.5" />}>
                  Post Feedback
                </Button>

              </form>
            </div>

            {/* Right: Reviews Feed */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 font-display">Client Reviews Ledger</h3>
              
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-5 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-8 h-8 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{rev.userName}</h4>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-11">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Related Products carousel */}
          {relatedProducts.length > 0 && (
            <div className="space-y-6">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-slate-900 font-display">Related Products</h3>
                <p className="text-xs text-slate-400 mt-1">Explore other listings from the {product.category} directory.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onQuickView={() => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};
