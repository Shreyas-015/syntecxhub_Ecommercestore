import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Laptop,
  Shirt,
  Home as HomeIcon,
  Sparkles,
  Dumbbell,
  BookOpen,
  Gamepad2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Mail,
  Flame,
  Star
} from "lucide-react";
import { TESTIMONIALS } from "../lib/dummyData";
import { ProductCard } from "../components/product/ProductCard";
import { QuickViewModal } from "../components/product/QuickViewModal";
import { Button } from "../components/common/Button";
import { PageTransition } from "../components/common/PageTransition";
import { useCart } from "../hooks/useCart";
import { productService } from "../services/productService";
import { Product } from "../types";
import { ProductSkeletonGrid } from "../components/common/Skeleton";

export const Home: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchHomeData = async () => {
      try {
        const [featured, latest] = await Promise.all([
          productService.getFeaturedProducts(),
          productService.getLatestProducts(4),
        ]);
        if (active) {
          setFeaturedProducts(featured.slice(0, 8));
          setLatestProducts(latest.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load home page products:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    fetchHomeData();
    return () => {
      active = false;
    };
  }, []);

  const handleQuickView = (product: any) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  const categories = [
    { id: "electronics", name: "Electronics", icon: Laptop, color: "from-blue-500/10 to-indigo-500/10 text-blue-600" },
    { id: "fashion", name: "Fashion", icon: Shirt, color: "from-amber-500/10 to-orange-500/10 text-amber-600" },
    { id: "shoes", name: "Shoes", icon: Flame, color: "from-rose-500/10 to-red-500/10 text-rose-600" },
    { id: "home", name: "Home", icon: HomeIcon, color: "from-emerald-500/10 to-teal-500/10 text-emerald-600" },
    { id: "beauty", name: "Beauty", icon: Sparkles, color: "from-purple-500/10 to-pink-500/10 text-purple-600" },
    { id: "sports", name: "Sports", icon: Dumbbell, color: "from-sky-500/10 to-cyan-500/10 text-sky-600" },
    { id: "books", name: "Books", icon: BookOpen, color: "from-yellow-500/10 to-amber-500/10 text-yellow-600" },
    { id: "gaming", name: "Gaming", icon: Gamepad2, color: "from-violet-500/10 to-fuchsia-500/10 text-violet-600" },
  ];

  return (
    <PageTransition>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-b border-slate-100">
        <div className="absolute top-0 right-0 -mr-24 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-60 -z-10" />
        <div className="absolute bottom-0 left-0 -ml-24 w-[400px] h-[400px] bg-slate-100 rounded-full blur-3xl opacity-60 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen E-Commerce Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-display leading-[1.1]">
                Elevate Your Everyday <span className="text-blue-600">Standard</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Welcome to Syntex Store. Explore our hand-picked showcase of high-end consumer hardware, bespoke fashion outerwear, tuned athletic footwear, and luxury home essentials.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate("/shop")}
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                >
                  Shop the Collection
                </Button>
                <Button
                  onClick={() => navigate("/about")}
                  variant="outline"
                  size="lg"
                >
                  Our Philosophy
                </Button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">20+</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Premium Items</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">99.8%</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Satisfaction Rating</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">2h</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Rapid Dispatch</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Hero Graphic */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-[450px] aspect-square rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-6 shadow-xl shadow-slate-100/50"
              >
                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">MacBook Pro M3</div>
                    <div className="text-[10px] text-green-600 font-bold">$3,199 (Save $300)</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Air Max Plus OG</div>
                    <div className="text-[10px] text-slate-400">Tuned Air Technology</div>
                  </div>
                </motion.div>

                {/* Centerpiece Image */}
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
                  alt="Featured Nike Sneaker"
                  className="max-h-[80%] max-w-[80%] object-contain mix-blend-multiply drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="py-16 bg-slate-50/30 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Curated Collections
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Sift through our tailored catalog by industry categories.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.id}`}
                  className="group bg-white border border-slate-100 p-5 rounded-2xl flex flex-col items-center text-center shadow-xs hover:shadow-md hover:border-blue-600/20 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 mt-4 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
                Featured Highlights
              </h2>
              <p className="text-sm text-slate-400">
                Highly demanded items hand-vetted by our product coordinators.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Explore Full Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Product Cards Row */}
          {isLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans text-sm">
              No featured products available at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* LATEST ARRIVALS GRID */}
      <section className="py-16 md:py-24 bg-slate-50/10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
                Latest Arrivals
              </h2>
              <p className="text-sm text-slate-400">
                Freshly added items sourced directly from international manufacturers.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View All New Releases</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <ProductSkeletonGrid count={4} />
          ) : latestProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans text-sm">
              No new products available at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4. WHY SHOP WITH US */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Uncompromising Standards
            </h2>
            <p className="text-sm text-slate-400">
              Why thousands of selective shoppers choose Syntex Store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm font-display">Express Logistics</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Orders dispatched within 2 hours of checkout utilizing top-tier air cargo routes globally.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm font-display">Cryptographic Payments</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                All customer transactions fully tokenized and underwritten by secure banking standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm font-display">Hassle-Free Returns</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Satisfied or fully refunded. Simply ship items back within 30 days for an automatic release.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm font-display">Conscious Desk 24/7</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                A round-the-clock desk of real product technicians prepared to assist you.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. DEALS BANNER */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 sm:p-12 md:p-16 text-white grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-3xl opacity-20 -z-0" />

            <div className="space-y-6 z-10 text-center lg:text-left">
              <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
                Seasonal Promotion
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display leading-tight">
                Unlock 15% Premium Discount on Hardware
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                Apply seasonal allowances to our high-capacity Apple workstations, Samsung mobile processors, and Sony acoustics today.
              </p>
              <Button
                onClick={() => navigate("/shop?category=electronics")}
                variant="primary"
                size="md"
              >
                Claim Electronics Deals
              </Button>
            </div>

            <div className="relative flex items-center justify-center z-10">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                alt="Sony Headset Promo"
                className="max-h-[250px] object-contain drop-shadow-2xl rounded-2xl rotate-2"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-16 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Approved by Connoisseurs
            </h2>
            <p className="text-sm text-slate-400">
              Read real logs from our verified corporate and lifestyle shoppers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((test) => (
              <div
                key={test.id}
                className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs flex flex-col justify-between"
              >
                <p className="text-slate-500 text-xs italic leading-relaxed">
                  "{test.comment}"
                </p>

                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                  <img
                    src={test.userAvatar}
                    alt={test.userName}
                    className="w-9 h-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{test.userName}</h4>
                    <span className="text-[10px] text-slate-400">{test.date}</span>
                  </div>
                  <div className="flex text-amber-400 gap-0.5">
                    {Array.from({ length: test.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. NEWSLETTER */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 border border-slate-100 p-8 sm:p-12 rounded-3xl text-center max-w-4xl mx-auto relative overflow-hidden">
            
            <div className="space-y-4 max-w-lg mx-auto z-10 relative">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Subscribe to Catalog Updates
              </h2>
              
              <p className="text-slate-400 text-sm">
                Receive instant notifications when seasonal footwear lists, technology releases, and apparel pricing revisions occur.
              </p>

              {newsletterSubscribed ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-xs font-medium border border-green-100 animate-in fade-in zoom-in-95">
                  🎉 Thank you for subscribing! We've sent a placeholder welcome benefit to your client log.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your personal email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-sans"
                  />
                  <Button type="submit" variant="primary" size="md">
                    Subscribe
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </PageTransition>
  );
};
