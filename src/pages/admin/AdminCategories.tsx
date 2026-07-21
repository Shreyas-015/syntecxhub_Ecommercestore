import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash,
  Archive,
  Download,
  Eye,
  X,
  Check,
  FolderOpen,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../../context/ToastContext";
import { categoryService, CategoryItem } from "../../services/categoryService";
import { Badge } from "../../components/common/Badge";
import { Skeleton } from "../../components/common/Skeleton";

export const AdminCategories: React.FC = () => {
  const { showToast } = useToast();

  // Core States
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // "", "active", "archived"

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>("");
  const [formSlug, setFormSlug] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Slug Autogeneration
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

  // Filtering Categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.slug && cat.slug.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" && cat.isActive) ||
      (statusFilter === "archived" && !cat.isActive);

    return matchesSearch && matchesStatus;
  });

  // Open Dialog Modal
  const openForm = (mode: "create" | "edit", category: CategoryItem | null = null) => {
    setFormMode(mode);
    setSelectedCategory(category);
    setFormErrors({});

    if (category) {
      setFormName(category.name);
      setFormSlug(category.slug);
      setFormDescription(category.description || "");
      setFormImage(category.image || "");
      setFormIsActive(category.isActive);
    } else {
      setFormName("");
      setFormSlug("");
      setFormDescription("");
      setFormImage("");
      setFormIsActive(true);
    }
    setIsFormOpen(true);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Category Name is required";
    if (!formSlug.trim()) errors.slug = "Category Slug is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: Partial<CategoryItem> = {
      name: formName,
      slug: formSlug,
      description: formDescription,
      image: formImage || "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80",
      isActive: formIsActive,
    };

    try {
      if (formMode === "create") {
        await categoryService.createCategory(payload);
        showToast("Category created successfully", "success");
      } else if (formMode === "edit" && selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, payload);
        showToast("Category updated successfully", "success");
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      showToast(err.message || "Failed to save category details", "error");
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (cat.productCount && cat.productCount > 0) {
      showToast(`Cannot delete category "${cat.name}" because it contains ${cat.productCount} active products.`, "warning");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete category "${cat.name}"?`)) return;

    try {
      await categoryService.deleteCategory(cat.id);
      showToast(`Category "${cat.name}" deleted successfully`, "success");
      loadCategories();
    } catch (err: any) {
      showToast(err.message || "Error deleting category", "error");
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (cat: CategoryItem) => {
    const updatedStatus = !cat.isActive;
    try {
      await categoryService.updateCategory(cat.id, { isActive: updatedStatus });
      showToast(`Category "${cat.name}" has been ${updatedStatus ? "Restored" : "Archived"}`, "success");
      loadCategories();
    } catch (err: any) {
      showToast(err.message || "Error changing category archive status", "error");
    }
  };

  // CSV Export Categories
  const handleExportCSV = () => {
    const headers = ["Category Name,Slug,Products Count,Status\n"];
    const rows = categories.map((c) => {
      return `"${c.name.replace(/"/g, '""')}","${c.slug}","${c.productCount || 0}","${c.isActive ? "Active" : "Archived"}"`;
    });
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Categories_Export_${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category Management</h1>
          <p className="text-xs text-slate-500 font-medium">Manage store categorization structures and mapping links</p>
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
            <Plus className="w-4 h-4" /> Create Category
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SEARCH */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search category name, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
          />
        </div>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full text-xs font-medium px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:bg-white focus:border-slate-950 transition-all text-slate-800"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Categories</option>
          <option value="archived">Archived Categories</option>
        </select>
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <Skeleton className="h-8 w-1/2 rounded-lg" />
                <Skeleton className="h-8 w-1/2 rounded-lg" />
              </div>
            </div>
          ))
        ) : filteredCategories.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-400 uppercase tracking-widest">
            No categories match your filter criteria.
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{cat.name}</h3>
                      <span className="block text-[9px] font-mono text-slate-400">/{cat.slug}</span>
                    </div>
                  </div>
                  {cat.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Archived</Badge>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed min-h-8 line-clamp-2">
                  {cat.description || "No description provided for this store category structure."}
                </p>

                <div className="flex items-center justify-between py-2 border-t border-b border-slate-100 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Mapped Products
                  </span>
                  <span className="text-xs font-black text-slate-900">{cat.productCount || 0} products</span>
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => openForm("edit", cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit details
                </button>
                <button
                  onClick={() => handleToggleArchive(cat)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                  title={cat.isActive ? "Archive Category" : "Restore Category"}
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-100 transition-colors"
                  title="Delete Category"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CATEGORY FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Content Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {formMode === "create" ? "Add Category Structure" : "Edit Category Properties"}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">Map navigation indexing structures</p>
                  </div>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  {/* CATEGORY NAME */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Category Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border ${
                        formErrors.name ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                      } focus:outline-none transition-colors`}
                      placeholder="e.g. Mechanical Keyboards"
                    />
                    {formErrors.name && <span className="text-[10px] text-red-500 font-bold">{formErrors.name}</span>}
                  </div>

                  {/* SLUG */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Category Slug</label>
                    <input
                      type="text"
                      disabled={formMode === "edit"}
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className={`w-full text-xs font-mono px-3 py-2.5 rounded-xl border ${
                        formErrors.slug ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-slate-950"
                      } disabled:bg-slate-100 focus:outline-none transition-colors`}
                      placeholder="mechanical-keyboards"
                    />
                    {formErrors.slug && <span className="text-[10px] text-red-500 font-bold">{formErrors.slug}</span>}
                  </div>

                  {/* IMAGE URL */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Icon / Cover Image URL</label>
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950 transition-colors"
                      placeholder="e.g. https://images.unsplash.com/..."
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">Description</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-950 transition-colors resize-none"
                      placeholder="Category explanation and metadata details..."
                    />
                  </div>

                  {/* ACTIVE CHECKBOX */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded text-slate-950 focus:ring-slate-950"
                      />
                      <span className="text-xs font-bold text-slate-700">Publish as active</span>
                    </label>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      {formMode === "create" ? "Create Category" : "Save Changes"}
                    </button>
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
