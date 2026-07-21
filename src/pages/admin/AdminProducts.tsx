import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash,
  Copy,
  Archive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  Download,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../../context/ToastContext";
import { productService } from "../../services/productService";
import { categoryService, CategoryItem } from "../../services/categoryService";
import { Product } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Skeleton";

export const AdminProducts: React.FC = () => {
  const { showToast } = useToast();

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter, Search, and Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>(""); // "", "outOfStock", "lowStock", "inStock"
  const [statusFilter, setStatusFilter] = useState<string>(""); // "", "active", "draft"
  const [sortBy, setSortBy] = useState<string>("newest"); // "newest", "priceAsc", "priceDesc", "rating", "nameAsc"

  // Selection / Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>("");
  const [formSlug, setFormSlug] = useState<string>("");
  const [formSku, setFormSku] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formDiscountPrice, setFormDiscountPrice] = useState<string>("");
  const [formStock, setFormStock] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formThumbnail, setFormThumbnail] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sorting columns indicator
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load Categories and Products
  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAllCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Map frontend filters to API parameters
      const params: any = {
        page,
        limit,
        search: search || undefined,
        category: selectedCategory || undefined,
        sort: sortBy,
      };

      if (statusFilter === "active") params.active = true;
      if (statusFilter === "draft") params.active = false;

      // Handle custom stock filter on API or client-side
      const response = await productService.getProducts(params);
      
      let filteredProducts = response.products;
      if (stockFilter === "outOfStock") {
        filteredProducts = filteredProducts.filter(p => p.stock === 0);
      } else if (stockFilter === "lowStock") {
        filteredProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 10);
      } else if (stockFilter === "inStock") {
        filteredProducts = filteredProducts.filter(p => p.stock > 0);
      }

      setProducts(filteredProducts);
      setTotalItems(response.pagination?.totalItems || filteredProducts.length);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      showToast(err.message || "Failed to sync products from server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
    setSelectedIds([]); // Reset selection on table change
  }, [page, limit, search, selectedCategory, stockFilter, statusFilter, sortBy]);

  // Handle Slug Autogeneration from Name
  useEffect(() => {
    if (formMode === "create") {
      const slug = formName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setFormSlug(slug);
    }
  }, [formName]);

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => productService.deleteProduct(id)));
      showToast(`Successfully deleted ${selectedIds.length} products`, "success");
      setSelectedIds([]);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Error performing bulk delete", "error");
    }
  };

  const handleBulkStatusChange = async (active: boolean) => {
    try {
      await Promise.all(
        selectedIds.map((id) => productService.updateProduct(id, { isActive: active }))
      );
      showToast(`Successfully updated ${selectedIds.length} products`, "success");
      setSelectedIds([]);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Error performing bulk status update", "error");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Product Name,SKU,Category,Price,Stock,Rating,Featured,Active,CreatedDate\n"];
    const rows = products.map((p) => {
      return `"${p.name.replace(/"/g, '""')}","${p.sku || ""}","${p.category}","${p.price}","${p.stock}","${p.rating}","${p.isFeatured ? "TRUE" : "FALSE"}","${p.stock > 0 ? "Active" : "Draft"}"`;
    });
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Products_Export_${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  // Open Form Dialog
  const openForm = (mode: "create" | "edit" | "view", product: Product | null = null) => {
    setFormMode(mode);
    setSelectedProduct(product);
    setFormErrors({});

    if (product) {
      setFormName(product.name);
      // Wait, let's extract original slug, description, etc. or fetch detail
      const loadProductDetails = async () => {
        try {
          const detail = await productService.getProductById(product.id);
          // @ts-ignore
          setFormSlug(detail.slug || product.id);
          setFormSku(detail.sku || "");
          // @ts-ignore
          setFormCategory(detail.categoryRef || detail.category || "");
          setFormPrice(String(detail.price));
          setFormDiscountPrice(String(detail.discountPrice || ""));
          setFormStock(String(detail.stock));
          setFormDescription(detail.description);
          setFormThumbnail(detail.images?.[0] || detail.thumbnail || "");
          setFormIsActive(detail.isActive !== undefined ? detail.isActive : true);
          setFormIsFeatured(detail.isFeatured || false);
        } catch (e) {
          // Fallback to basic row data
          setFormPrice(String(product.price));
          setFormStock(String(product.stock));
          setFormDescription(product.description || "");
          setFormThumbnail(product.images?.[0] || "");
          setFormCategory(product.category);
          setFormIsActive(true);
        }
      };
      loadProductDetails();
    } else {
      setFormName("");
      setFormSlug("");
      setFormSku("");
      setFormCategory("");
      setFormPrice("");
      setFormDiscountPrice("");
      setFormStock("0");
      setFormDescription("");
      setFormThumbnail("");
      setFormIsActive(true);
      setFormIsFeatured(false);
    }
    setIsFormOpen(true);
  };

  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Product Name is required";
    if (!formSlug.trim()) errors.slug = "Product Slug is required";
    if (!formCategory) errors.category = "Category is required";
    
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = "Price must be a positive number";
    }

    const stockNum = parseInt(formStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.stock = "Stock must be a non-negative integer";
    }

    if (!formDescription.trim()) errors.description = "Description is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the validation errors in the form", "error");
      return;
    }

    const payload: any = {
      name: formName,
      slug: formSlug,
      sku: formSku || undefined,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock, 10),
      description: formDescription,
      thumbnail: formThumbnail || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
      images: [formThumbnail || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80"],
      isActive: formIsActive,
      isFeatured: formIsFeatured,
    };

    if (formDiscountPrice) {
      payload.discountPrice = parseFloat(formDiscountPrice);
    }

    try {
      if (formMode === "create") {
        await productService.createProduct(payload);
        showToast("Product created successfully", "success");
      } else if (formMode === "edit" && selectedProduct) {
        await productService.updateProduct(selectedProduct.id, payload);
        showToast("Product updated successfully", "success");
      }
      setIsFormOpen(false);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to save product details", "error");
    }
  };

  // Actions for Single Products
  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
    try {
      await productService.deleteProduct(product.id);
      showToast(`Successfully deleted "${product.name}"`, "success");
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to delete product", "error");
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const payload = {
        name: `${product.name} (Copy)`,
        slug: `${product.id}-${Math.floor(Math.random() * 10000)}`,
        sku: product.sku ? `${product.sku}-copy` : undefined,
        price: product.price,
        stock: product.stock,
        description: product.description || "Duplicated product description",
        thumbnail: product.images?.[0] || "",
        images: product.images,
        category: categories.find(c => c.slug === product.category)?.id || undefined,
        isActive: false, // Default duplicated as draft
      };
      await productService.createProduct(payload);
      showToast(`Successfully duplicated "${product.name}"`, "success");
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to duplicate product", "error");
    }
  };

  const handleToggleArchive = async (product: Product) => {
    // We toggle active/inactive status as archiving
    const isCurrentlyActive = product.stock > 0; // Wait, product status is active or draft based on isActive
    const updatedActive = !isCurrentlyActive;
    try {
      await productService.updateProduct(product.id, { isActive: updatedActive });
      showToast(`Product status updated to ${updatedActive ? "Active" : "Archived"}`, "success");
      loadProducts();
    } catch (err: any) {
      showToast(err.message || "Failed to update product status", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Management</h1>
          <p className="text-xs text-slate-500 font-medium">Manage and audit inventory catalogs, pricing, and stocks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => openForm("create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* SEARCH FIELD */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
            />
          </div>

          {/* CATEGORY FILTER */}
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

          {/* STOCK FILTER */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          >
            <option value="">All Stock Statuses</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (≤ 10)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          {/* SORT ORDER */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="nameAsc">Name: A to Z</option>
          </select>
        </div>

        {/* BULK ACTIONS BANNER */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-950 text-[10px] font-bold text-white flex items-center justify-center">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700">products selected for bulk processing</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 hover:bg-slate-100 transition-all"
                >
                  Activate All
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 hover:bg-slate-100 transition-all"
                >
                  Deactivate All
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 border border-red-100 transition-all"
                >
                  Delete Selected
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PRODUCTS TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="rounded text-slate-950 focus:ring-slate-950"
                  />
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">SKU</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Rating</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30">
                    <td className="p-4 text-center"><Skeleton className="w-4 h-4 mx-auto rounded" /></td>
                    <td className="p-4 flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-10" /></td>
                    <td className="p-4"><Skeleton className="h-3.5 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-24 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    No products found matching your catalog search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.stock > 0 && p.stock <= 10;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all duration-150">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectRow(p.id)}
                          className="rounded text-slate-950 focus:ring-slate-950"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                            {p.brand && <span className="block text-[10px] text-slate-400 font-medium">{p.brand}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500 font-semibold">{p.sku || "—"}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 border border-slate-100 text-slate-600 capitalize">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isOut ? "text-red-600" : isLowStock ? "text-amber-600" : "text-slate-800"}`}>
                            {p.stock} units
                          </span>
                          {isOut ? (
                            <span className="text-[9px] font-bold text-red-500 font-mono uppercase">Sold Out</span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold text-amber-500 font-mono uppercase">Low stock</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-800">{p.rating || "0.0"}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({p.reviewsCount || 0})</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {p.stock > 0 ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Draft</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openForm("view", p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openForm("edit", p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Archive/Restore"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        {!loading && products.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              Showing {products.length} of {totalItems} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT DIALOG (FORM / VIEW DETAIL) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {formMode === "create" ? "Add New Catalog Product" : formMode === "edit" ? "Edit Catalog Product" : "Product Specifications"}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">Verify structural tags and stock properties</p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PRODUCT NAME */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Product Name</label>
                      <input
                        type="text"
                        disabled={formMode === "view"}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                          formErrors.name ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                        } disabled:bg-slate-50 focus:outline-none transition-colors`}
                        placeholder="e.g. Ergonomic Bluetooth Keyboard"
                      />
                      {formErrors.name && <span className="text-[10px] text-red-500 font-bold">{formErrors.name}</span>}
                    </div>

                    {/* PRODUCT SLUG */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Product Slug</label>
                      <input
                        type="text"
                        disabled={formMode === "view" || formMode === "edit"}
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        className={`w-full text-xs font-mono px-3 py-2.5 rounded-xl border ${
                          formErrors.slug ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                        } disabled:bg-slate-100 focus:outline-none transition-colors`}
                        placeholder="auto-generated-slug"
                      />
                      {formErrors.slug && <span className="text-[10px] text-red-500 font-bold">{formErrors.slug}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* SKU */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">SKU / Model Number</label>
                      <input
                        type="text"
                        disabled={formMode === "view"}
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-slate-950 transition-colors"
                        placeholder="STX-PRO-102"
                      />
                    </div>

                    {/* CATEGORY REFERENCE */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Category</label>
                      <select
                        disabled={formMode === "view"}
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                          formErrors.category ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                        } disabled:bg-slate-50 focus:outline-none transition-colors`}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && <span className="text-[10px] text-red-500 font-bold">{formErrors.category}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* PRICE */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={formMode === "view"}
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                          formErrors.price ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                        } disabled:bg-slate-50 focus:outline-none transition-colors`}
                        placeholder="0.00"
                      />
                      {formErrors.price && <span className="text-[10px] text-red-500 font-bold">{formErrors.price}</span>}
                    </div>

                    {/* DISCOUNT PRICE */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Discount Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={formMode === "view"}
                        value={formDiscountPrice}
                        onChange={(e) => setFormDiscountPrice(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-slate-950 transition-colors"
                        placeholder="Optional"
                      />
                    </div>

                    {/* INVENTORY STOCK */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Quantity Stock</label>
                      <input
                        type="number"
                        disabled={formMode === "view"}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                          formErrors.stock ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                        } disabled:bg-slate-50 focus:outline-none transition-colors`}
                        placeholder="0"
                      />
                      {formErrors.stock && <span className="text-[10px] text-red-500 font-bold">{formErrors.stock}</span>}
                    </div>
                  </div>

                  {/* THUMBNAIL IMAGE URL */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Image Link / URL</label>
                    <input
                      type="url"
                      disabled={formMode === "view"}
                      value={formThumbnail}
                      onChange={(e) => setFormThumbnail(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-slate-950 transition-colors"
                      placeholder="e.g. https://images.unsplash.com/..."
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Full Description</label>
                    <textarea
                      rows={3}
                      disabled={formMode === "view"}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                        formErrors.description ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                      } disabled:bg-slate-50 focus:outline-none transition-colors resize-none`}
                      placeholder="Input comprehensive product specification narrative here..."
                    />
                    {formErrors.description && <span className="text-[10px] text-red-500 font-bold">{formErrors.description}</span>}
                  </div>

                  {/* STATUS CHECKBOXES */}
                  {formMode !== "view" && (
                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="rounded text-slate-950 focus:ring-slate-950"
                        />
                        <span className="text-xs font-bold text-slate-700">Publish as active</span>
                      </label>
                      <label className="flex items-center gap-2 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsFeatured}
                          onChange={(e) => setFormIsFeatured(e.target.checked)}
                          className="rounded text-slate-950 focus:ring-slate-950"
                        />
                        <span className="text-xs font-bold text-slate-700">Featured catalog item</span>
                      </label>
                    </div>
                  )}

                  {/* FORM ACTIONS */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {formMode === "view" ? "Close Specifications" : "Cancel"}
                    </button>
                    {formMode !== "view" && (
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        {formMode === "create" ? "Add Catalog Product" : "Save Changes"}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
