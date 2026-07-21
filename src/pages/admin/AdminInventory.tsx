import React, { useState, useEffect } from "react";
import {
  Search,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Edit2,
  Boxes,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { productService } from "../../services/productService";
import { categoryService, CategoryItem } from "../../services/categoryService";
import { Product } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Skeleton";

export const AdminInventory: React.FC = () => {
  const { showToast } = useToast();

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockStatus, setStockStatus] = useState<string>(""); // "", "outOfStock", "lowStock", "inStock"

  // Quick Adjustment Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);
  const [submittingAdjust, setSubmittingAdjust] = useState<boolean>(false);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (e) {
      console.error("Error loading categories for inventory view", e);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Query parameters for full catalog retrieve
      const params = {
        page: 1,
        limit: 100, // Fetch first 100 products to filter on client-side and make inline adjustments snappy
      };
      const response = await productService.getProducts(params);
      setProducts(response.products || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load inventory assets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  // Filter & Search Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === "" || p.category === selectedCategory;

    // Stock Status checks
    let matchesStock = true;
    if (stockStatus === "outOfStock") {
      matchesStock = p.stock === 0;
    } else if (stockStatus === "lowStock") {
      matchesStock = p.stock > 0 && p.stock <= 10;
    } else if (stockStatus === "inStock") {
      matchesStock = p.stock > 10;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Pagination Slice
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  // Inline Adjustment functions
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setTempStockValue(product.stock);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdateStock = async (product: Product) => {
    if (tempStockValue < 0) {
      showToast("Quantity cannot be negative", "error");
      return;
    }

    setSubmittingAdjust(true);
    try {
      await productService.updateProduct(product.id, { stock: tempStockValue });
      showToast(`Stock updated for "${product.name}" to ${tempStockValue}`, "success");
      
      // Update local state without full refresh for responsiveness
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, stock: tempStockValue } : item))
      );
      setEditingId(null);
    } catch (err: any) {
      showToast(err.message || "Error adjusting stock quantity", "error");
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleQuickAdd = async (product: Product, amount: number) => {
    const nextVal = Math.max(0, product.stock + amount);
    try {
      await productService.updateProduct(product.id, { stock: nextVal });
      showToast(`Stock adjusted to ${nextVal} for "${product.name}"`, "success");
      
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, stock: nextVal } : item))
      );
    } catch (err: any) {
      showToast(err.message || "Error with quick addition", "error");
    }
  };

  // Metrics calculations
  const totalSkuCount = products.length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Inventory Ledger</h1>
          <p className="text-xs text-slate-500 font-medium">Verify stock volume thresholds, low-count warning nodes, and item assets</p>
        </div>
        <button
          onClick={loadProducts}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Ledger
        </button>
      </div>

      {/* MINI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL SKU CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKUs Tracked</span>
            <span className="block text-xl font-black text-slate-950">{totalSkuCount} catalog items</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL UNITS CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Units</span>
            <span className="block text-xl font-black text-slate-950">{totalStockUnits} total items</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* LOW STOCK CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest">Low Stock Items</span>
            <span className="block text-xl font-black text-amber-600">{lowStockCount} items warning</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl border border-amber-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* OUT OF STOCK CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest">Sold Out Items</span>
            <span className="block text-xl font-black text-red-600">{outOfStockCount} items empty</span>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by SKU, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          />
        </div>

        {/* CATEGORY SELECTOR */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* STOCK QUANTITY FILTER */}
        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Stock Thresholds</option>
          <option value="inStock">Well Stocked (&gt; 10)</option>
          <option value="lowStock">Low Stock Threshold (≤ 10)</option>
          <option value="outOfStock">Sold Out (0 units)</option>
        </select>
      </div>

      {/* LEDGER DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Catalog Specification</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">SKU / Code</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Current Stock</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock Alert Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Unit Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Inline Stock Calibration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="p-4 flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-10" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-12" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-28 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No matching catalog assets in stock databases.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= 10;
                  const isEditing = editingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all duration-150">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500 font-semibold">{p.sku || "—"}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-100 text-slate-600 capitalize">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-extrabold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4">
                        {isOut ? (
                          <Badge variant="danger">Sold Out</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Well Stocked</Badge>
                        )}
                      </td>
                      <td className="p-4 text-xs font-black text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(parseInt(e.target.value, 10) || 0)}
                              className="w-16 px-1.5 py-1 text-center text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-slate-950 text-slate-800"
                            />
                            <button
                              onClick={() => handleUpdateStock(p)}
                              disabled={submittingAdjust}
                              className="p-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* QUICK QUANTITY INCREMENT DECREMENT */}
                            <button
                              onClick={() => handleQuickAdd(p, -5)}
                              disabled={p.stock < 5}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                              title="Decrease stock by 5"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleQuickAdd(p, 5)}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-all"
                              title="Increase stock by 5"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => startEditing(p)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
                              title="Set Exact Quantity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {!loading && totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              Showing {paginatedProducts.length} of {totalItems} items
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
    </div>
  );
};
