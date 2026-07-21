import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Twitter, Instagram, Facebook, Youtube, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      
      {/* Upper Features Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Free Global Delivery</h4>
            <p className="text-slate-500 text-xs mt-0.5">On all orders exceeding $150 worldwide.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Encrypted Checkouts</h4>
            <p className="text-slate-500 text-xs mt-0.5">Underwritten by industry standard token encryptions.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">30-Day Money-Back</h4>
            <p className="text-slate-500 text-xs mt-0.5">Hassle-free return policy if you aren't satisfied.</p>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">
              Syntex<span className="text-blue-500">Store</span>
            </span>
          </Link>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
            Crafting the ultimate digital interface for premium gadgets, lifestyle clothing, designer footwear, and modern home essentials. Elevate your everyday standards.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Products */}
        <div>
          <h5 className="text-white font-semibold text-xs tracking-wider uppercase font-mono mb-4">
            Shop Categories
          </h5>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop?category=electronics" className="hover:text-white transition-colors">Electronics</Link></li>
            <li><Link to="/shop?category=fashion" className="hover:text-white transition-colors">Fashion Apparel</Link></li>
            <li><Link to="/shop?category=shoes" className="hover:text-white transition-colors">Premium Shoes</Link></li>
            <li><Link to="/shop?category=home" className="hover:text-white transition-colors">Home & Decor</Link></li>
            <li><Link to="/shop?category=gaming" className="hover:text-white transition-colors">Gaming Gear</Link></li>
          </ul>
        </div>

        {/* Column 3: Corporate */}
        <div>
          <h5 className="text-white font-semibold text-xs tracking-wider uppercase font-mono mb-4">
            Syntex Corp
          </h5>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-white transition-colors">About Our Vision</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Get in touch</Link></li>
          </ul>
        </div>

        {/* Column 4: Help & Info */}
        <div>
          <h5 className="text-white font-semibold text-xs tracking-wider uppercase font-mono mb-4">
            Customer Support
          </h5>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/contact" className="hover:text-white transition-colors">Help Center / FAQs</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Return Logistics</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Store Locator</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Track Shipment</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Charter</a></li>
          </ul>
        </div>

      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs gap-4 text-slate-500">
          <div>
            © {new Date().getFullYear()} Syntex Store. All Rights Reserved. Designed for premium aesthetics.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Cookie Preferences</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
