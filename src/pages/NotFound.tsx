import React from "react";
import { Link } from "react-router-dom";
import { Compass, Sparkles } from "lucide-react";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";

export const NotFound: React.FC = () => {
  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="space-y-6 max-w-md">
          
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-100 border border-blue-100">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-bold tracking-widest text-slate-400 font-mono uppercase">
              Page Not Found (404)
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Lost in Navigation Space
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              The requested directory path is outside the scope of Syntex Store's visual catalog routes.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/">
              <Button variant="primary">
                Return to Storefront
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
