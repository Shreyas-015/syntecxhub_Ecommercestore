import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, Sparkles, Home, ArrowLeft } from "lucide-react";

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Sparkles className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 mt-4 font-semibold tracking-wider uppercase font-mono">
          Checking Credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            You do not have the administration privileges required to access this section. If you believe this is an error, please contact your systems administrator.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Storefront
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white bg-slate-950 hover:bg-slate-900 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
