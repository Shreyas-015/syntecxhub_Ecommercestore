import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Sparkles } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-slate-150 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
            
            {/* Header Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span>System Error Captured</span>
              </span>
            </div>

            {/* Illustration Icon */}
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm relative">
              <Sparkles className="w-5 h-5 text-rose-400 absolute top-2 right-2 animate-pulse" />
              <AlertTriangle className="w-10 h-10" />
            </div>

            {/* Heading and text */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                Something Went Wrong
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Our secure localized sandbox encountered an unexpected routing or render anomaly. Don't worry, your data coordinates are secure.
              </p>
            </div>

            {/* Optional Error message print for debugging */}
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[10px] font-mono text-slate-500 text-left overflow-auto max-h-24">
                <span className="font-bold text-rose-600 block mb-0.5">Details:</span>
                {this.state.error.toString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 active:scale-95 transition-all cursor-pointer group"
              >
                <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-360" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return Home</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
