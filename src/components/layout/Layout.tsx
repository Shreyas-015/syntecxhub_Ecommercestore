import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Navbar } from "../navbar/Navbar";
import { Footer } from "../footer/Footer";
import { CartDrawer } from "../navbar/CartDrawer";

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Sticky Top Navbar */}
      <Navbar />

      {/* Main Page Area with Route transitions */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>

      {/* Global Persisted Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <Footer />
    </div>
  );
};
