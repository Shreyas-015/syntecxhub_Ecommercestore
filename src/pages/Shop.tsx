import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Grid, List, SlidersHorizontal, Star, Heart, ShoppingBag, Eye, RotateCcw } from "lucide-react";
import { BRANDS } from "../lib/dummyData";
import { ProductCard } from "../components/product/ProductCard";
import { QuickViewModal } from "../components/product/QuickViewModal";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { PageTransition } from "../components/common/PageTransition";
import { useCart } from "../hooks/useCart";
import { productService } from "../services/productService";
import { Product } from "../types";

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isInWishlist, wishlist } = useCart();

  // Search parameters parsed from URL
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "all";
  const urlDeal = searchParams.get("deal") === "true";
  const urlWishlist = searchParams.get("wishlist") === "true";

  // Filter States
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [maxPrice, setMaxPrice] = useState(3500);
  const [sortBy, setSortBy] = useState("featured");
  const [isGridMode, setIsGridMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dynamic Backend States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Update states if URL parameters change
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setSelectedCategory(urlCategory);
    setCurrentPage(1);
  }, [urlCategory]);

  useEffect(() => {
    if (urlWishlist) {
      setCurrentPage(1);
    }
  }, [urlWishlist]);

  // Fetch Category List dynamically with counts from Backend on mount
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const cats = await productService.getCategories();
        const mapped = [
          { id: "all", name: "All Curation", slug: "all" },
          ...cats.map((c: any) => ({
            id: c.slug || c.id,
            name: c.name,
            slug: c.slug,
            count: c.productCount,
          })),
        ];
        setCategories(mapped);
      } catch (err) {
        console.error("Failed to fetch dynamic categories:", err);
      }
    };
    fetchCategoriesData();
  }, []);

  // Fetch Paginated, Filtered & Sorted Products from Backend
  useEffect(() => {
    let active = true;
    const fetchFilteredProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: 8,
          search: searchQuery.trim() || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          brand: selectedBrand !== "All Brands" ? selectedBrand : undefined,
          maxPrice: maxPrice < 3500 ? maxPrice : undefined,
          sort: sortBy !== "featured" ? sortBy : undefined,
        };

        const res = await productService.getProducts(params);
        if (!active) return;

        let resultProducts = res.products;
        let finalPagination = res.pagination;

        // Apply client-side Filter by Deals Only (if URL promotional key is checked)
        if (urlDeal) {
          resultProducts = resultProducts.filter((p) => p.discountPrice < p.price);
        }

        // Apply client-side Filter by Wishlist Only (local cache reactive)
        if (urlWishlist) {
          resultProducts = resultProducts.filter((p) => isInWishlist(p.id));
        }

        setProducts(resultProducts);
        setPagination(finalPagination);
        setTotalCount(finalPagination?.totalItems || resultProducts.length);
      } catch (err) {
        console.error("Failed to fetch products from backend catalogue:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    // Debounce search query changes by 300ms for responsiveness and rate-limiting
    const debounceTimer = setTimeout(() => {
      fetchFilteredProducts();
    }, 300);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, selectedCategory, selectedBrand, maxPrice, sortBy, currentPage, urlDeal, urlWishlist, wishlist]);

  const handleQuickView = (product: any) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  // Reset Filters Utility
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("All Brands");
    setMaxPrice(3500);
    setSortBy("featured");
    setSearchParams({});
    setCurrentPage(1);
  };

  const totalPages = pagination?.totalPages || 1;
  const paginatedProducts = products;

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Title Banner */}
          <div className="mb-8 space-y-2">
            <div className="text-xs font-bold text-blue-600 font-mono tracking-wider uppercase">
              Syntex Stock Directory
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              {urlWishlist ? "Your Custom Wishlist" : urlDeal ? "Exclusive Seasonal Sales" : "Discover Premium Products"}
            </h1>
            <p className="text-sm text-slate-400">
              Showing {paginatedProducts.length} of {totalCount} curated assets.
            </p>
          </div>

          {/* Filters Bar & Layout Controls */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            
            {/* Search Input Filter */}
            <div className="relative w-full md:max-w-sm">
              <input
                type="text"
                placeholder="Filter search scope..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Best Customer Rating</option>
                </select>
              </div>

              {/* Grid/List View Toggles */}
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button
                  onClick={() => setIsGridMode(true)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isGridMode ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsGridMode(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    !isGridMode ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Filter Menu - Desktop */}
            <div className={`lg:block ${showMobileFilters ? "block" : "hidden"} space-y-6`}>
              
              {/* Category Links */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Category list
                  </h3>
                  {selectedCategory !== "all" && (
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 font-sans">
                  {categories.length === 0 ? (
                    <div className="space-y-1">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCurrentPage(1);
                          setSearchParams(cat.id === "all" ? {} : { category: cat.id });
                        }}
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl text-left transition-colors font-medium ${
                          selectedCategory === cat.id
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="capitalize">{cat.name}</span>
                        {cat.count !== undefined && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                            {cat.count}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Brands Filter
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((br) => (
                    <button
                      key={br}
                      onClick={() => {
                        setSelectedBrand(br);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                        selectedBrand === br
                          ? "bg-slate-900 border-slate-900 text-white font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {br}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">
                    Max Price Limit
                  </h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="15"
                    max="3500"
                    step="20"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between items-baseline text-xs text-slate-500 font-medium">
                    <span>Min: $15</span>
                    <span className="text-slate-900 font-bold text-sm font-display">${maxPrice}</span>
                  </div>
                </div>
              </div>

              {/* Reset All Filters */}
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Filters
              </Button>

            </div>

            {/* Products Main Grid */}
            <div className="lg:col-span-3 space-y-8">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-3xl p-4 space-y-4 shadow-xs">
                      <div className="animate-pulse bg-slate-200/90 rounded-xl aspect-[4/3] w-full" />
                      <div className="space-y-2">
                        <div className="animate-pulse bg-slate-200/90 h-3 w-1/4 rounded" />
                        <div className="animate-pulse bg-slate-200/90 h-5 w-2/3 rounded" />
                        <div className="animate-pulse bg-slate-200/90 h-4 w-1/2 rounded" />
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="animate-pulse bg-slate-200/90 h-6 w-16 rounded" />
                        <div className="animate-pulse bg-slate-200/90 h-9 w-24 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">No products match your criteria</h3>
                    <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Try expanding your price range, updating your search terms, or shifting your chosen brand parameters.
                    </p>
                  </div>
                  <Button onClick={handleResetFilters} variant="secondary" size="sm">
                    Clear Active Filters
                  </Button>
                </div>
              ) : (
                <>
                  {isGridMode ? (
                    /* GRID LAYOUT */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {paginatedProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onQuickView={handleQuickView}
                        />
                      ))}
                    </div>
                  ) : (
                    /* LIST LAYOUT */
                    <div className="space-y-4">
                      {paginatedProducts.map((p) => {
                        const discounted = p.discountPrice < p.price;
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-100/80 p-5 flex flex-col sm:flex-row gap-5 hover:shadow-lg hover:border-slate-200/50 transition-all duration-300 relative group"
                          >
                            {/* Product Image */}
                            <div className="w-full sm:w-44 h-44 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-3 relative flex-shrink-0">
                              <img
                                src={p.images[0]}
                                alt=""
                                className="max-h-full max-w-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              {p.isNew && (
                                <Badge variant="primary" className="absolute top-2 left-2 shadow-xs">
                                  NEW
                                </Badge>
                              )}
                            </div>

                            {/* Product Meta details */}
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                                    {p.brand}
                                  </span>
                                  <h3 className="font-bold text-slate-800 text-base font-sans mt-0.5 group-hover:text-blue-600 transition-colors">
                                    {p.name}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center text-amber-400">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <Star
                                        key={idx}
                                        className={`w-3.5 h-3.5 ${
                                          idx < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700">{p.rating}</span>
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed max-w-xl line-clamp-2">
                                  {p.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-extrabold text-slate-900 font-display">
                                    ${p.discountPrice}
                                  </span>
                                  {discounted && (
                                    <span className="text-xs text-slate-400 line-through">
                                      ${p.price}
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleQuickView(p)}
                                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                    title="Quick view"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleWishlist(p.id)}
                                    className={`p-2.5 rounded-xl border transition-colors ${
                                      isInWishlist(p.id)
                                        ? "border-red-100 bg-red-50 text-red-500"
                                        : "border-slate-200 text-slate-400 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? "fill-red-500" : ""}`} />
                                  </button>
                                  <button
                                    onClick={() => addToCart(p, 1)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/10"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Add to Cart</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Section */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-4">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                              currentPage === pageNum
                                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/10"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </PageTransition>
  );
};
