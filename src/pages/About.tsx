import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Trophy, ShieldAlert, HeartHandshake, Eye, ArrowRight } from "lucide-react";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";

export const About: React.FC = () => {
  const values = [
    {
      icon: Trophy,
      title: "Bespoke Quality",
      desc: "Every item in our storefront is hand-vetted for hardware composition, textile grade, and premium long-term integrity.",
    },
    {
      icon: ShieldAlert,
      title: "Cryptographic Transparency",
      desc: "Our checkout standards protect buyers with tokenized payment channels and direct ledger tracking.",
    },
    {
      icon: HeartHandshake,
      title: "Guaranteed Satisfaction",
      desc: "Hassle-free 30-day money back allowances ensure that you shop with peace of mind.",
    },
  ];

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Section 1: Hero Pitch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Our Visionary Concept</span>
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-display leading-tight">
                Engineering a Premium Shopping Ecosystem
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Syntex Store was founded on a simple, uncompromising vision: to build a seamless digital storefront that gathers elite consumer electronics, fashion outerwear, custom sneakers, and luxury home design coordinates under a single visual ceiling.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                We believe that modern consumers shouldn't have to trade off between visual craftsmanship and system performance. By pairing fluid interface micro-interactions with premium logistics, we've crafted an environment that raises everyday consumer expectations.
              </p>
              <div className="pt-2">
                <Link to="/shop">
                  <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                    Browse the Inventory
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-[450px] aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                  alt="Modern Retail Storefront Design"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Core Values Grid */}
          <div className="space-y-10 pt-10 border-t border-slate-200">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Our Operating Philosophy
              </h2>
              <p className="text-xs text-slate-400">
                The core convictions that direct every catalog revision and shipment at Syntex Store.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={i} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base font-display">{v.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Team bento or credentials */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden text-center max-w-4xl mx-auto space-y-6">
            <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-10" />
            <h3 className="text-xl sm:text-2xl font-bold font-display z-10 relative">
              Phase 2 Preview: Unified Backends & Databases
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto z-10 relative">
              While Phase 1 establishes our high-fidelity, responsive client-side routing, page-gallery, and interactive basket drawers, Phase 2 will introduce our Express.js backend API, MongoDB datastore, JWT login protocols, and live Razorpay payment processing.
            </p>
            <div className="flex justify-center gap-4 pt-2 z-10 relative">
              <span className="px-3.5 py-1.5 bg-slate-800 text-blue-400 rounded-lg text-xs font-bold font-mono border border-slate-700">
                JWT Auth
              </span>
              <span className="px-3.5 py-1.5 bg-slate-800 text-green-400 rounded-lg text-xs font-bold font-mono border border-slate-700">
                MongoDB API
              </span>
              <span className="px-3.5 py-1.5 bg-slate-800 text-amber-400 rounded-lg text-xs font-bold font-mono border border-slate-700">
                Razorpay Secure
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
