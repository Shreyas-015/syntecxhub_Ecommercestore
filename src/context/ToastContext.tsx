import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Individual Toast Item with Timer, Pause-on-Hover, and Progress bar
const ToastItem: React.FC<{
  toast: Toast;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(4000);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(intervalRef.current!);
          onClose();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, onClose]);

  let bgClass = "bg-white border-slate-200 text-slate-800 shadow-xl";
  let Icon = Info;
  let iconColorClass = "text-blue-500";
  let progressColorClass = "bg-blue-500";

  if (toast.type === "success") {
    bgClass = "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/40 shadow-lg";
    Icon = CheckCircle;
    iconColorClass = "text-emerald-500";
    progressColorClass = "bg-emerald-500";
  } else if (toast.type === "error") {
    bgClass = "bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/40 shadow-lg";
    Icon = AlertCircle;
    iconColorClass = "text-rose-500";
    progressColorClass = "bg-rose-500";
  } else if (toast.type === "warning") {
    bgClass = "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/40 shadow-lg";
    Icon = AlertTriangle;
    iconColorClass = "text-amber-500";
    progressColorClass = "bg-amber-500";
  }

  const progressPercentage = (timeLeft / 4000) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="assertive"
      className={`p-4 rounded-2xl border flex flex-col pointer-events-auto select-none relative overflow-hidden max-w-sm w-full group/toast ${bgClass}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs font-bold leading-relaxed pr-2">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 p-1 rounded-xl transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Small Shimmer/Timer progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100/50">
        <div
          className={`h-full ${progressColorClass} transition-all duration-100 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We keep active toasts separate from the incoming queue
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);
  const [queue, setQueue] = useState<Toast[]>([]);

  // Function to process the queue and ensure max 3 active toasts
  const processQueue = useCallback((active: Toast[], pending: Toast[]) => {
    let updatedActive = [...active];
    let updatedPending = [...pending];

    while (updatedActive.length < 3 && updatedPending.length > 0) {
      const nextToast = updatedPending.shift()!;
      updatedActive.push(nextToast);
    }

    return { active: updatedActive, pending: updatedPending };
  }, []);

  const removeToast = useCallback((id: string) => {
    setActiveToasts((prevActive) => {
      const filtered = prevActive.filter((t) => t.id !== id);
      setQueue((prevQueue) => {
        if (prevQueue.length > 0) {
          const next = prevQueue[0];
          const newQueue = prevQueue.slice(1);
          // Append next from queue to the active ones
          setTimeout(() => {
            setActiveToasts((curr) => {
              if (curr.length < 3 && !curr.some(c => c.id === next.id)) {
                return [...curr, next];
              }
              return curr;
            });
          }, 50);
          return newQueue;
        }
        return prevQueue;
      });
      return filtered;
    });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: Toast = { id, message, type };

    setActiveToasts((prevActive) => {
      if (prevActive.length < 3) {
        return [...prevActive, newToast];
      } else {
        setQueue((prevQueue) => [...prevQueue, newToast]);
        return prevActive;
      }
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts: activeToasts, removeToast }}>
      {children}
      
      {/* Toast Render Area - Fixed at bottom-right for desktop and full-width at top/bottom for mobile */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {activeToasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
