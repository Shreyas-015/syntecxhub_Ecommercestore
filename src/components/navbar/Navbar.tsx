import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, User, Sparkles, LogOut, Package, ChevronDown, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../context/AuthContext";

export const Navbar: React.FC = () => {
  const { cartItemsCount, wishlist, setIsCartOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLinks = [
    { name: "Home", to: "/" },
    { name: "Shop", to: "/shop" },
    { name: "Deals", to: "/shop?deal=true" },
    { name: "About Us", to: "/about" },
    { name: "Contact", to: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/10 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Syntex<span className="text-blue-600">Store</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-all hover:text-blue-600 relative py-1 ${
                    isActive ? "text-blue-600 font-bold" : "text-slate-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative w-full max-w-xs xl:max-w-md mx-6"
          >
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-sans"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Right Core Actions */}
          <div className="flex items-center gap-2 sm:gap-4 relative">
            
            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative"
              title="View Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative"
              title="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-mono text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Authentication Core Visual States */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  className="hidden sm:inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-bold text-slate-800 tracking-tight max-w-[100px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      ref={dropdownRef}
                      role="menu"
                      aria-labelledby="user-menu-trigger"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.1 } }}
                      className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100/80 rounded-2xl shadow-xl py-2 z-20"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-50">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                      </div>
                      
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile Dashboard</span>
                        </Link>
                        
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Purchase Ledger</span>
                        </Link>

                        <Link
                          to="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>Vault Wishlist</span>
                        </Link>

                        <Link
                          to="/cart"
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>Shopping Cart Page</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Global Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-50 p-1.5 mt-1">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Safe Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 pl-3.5 pr-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-md shadow-slate-950/5 active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </form>

          {/* Links list */}
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated && user ? (
              <div className="pt-4 border-t border-slate-100 space-y-3.5">
                <div className="flex items-center gap-3 px-1">
                  <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-semibold">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>Orders</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span>Wishlist</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    <span>Cart Page</span>
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100/50 transition-colors cursor-pointer mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Safe Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors mt-2"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
