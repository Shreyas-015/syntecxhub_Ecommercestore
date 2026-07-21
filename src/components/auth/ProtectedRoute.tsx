import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sparkles } from "lucide-react";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Sparkles className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 mt-4 font-semibold tracking-wider uppercase font-mono">
          Verifying Identity...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but store original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
