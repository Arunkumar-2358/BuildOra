import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const variants = {
  success: { Icon: CheckCircle2, className: "border-success/40 bg-success/10 text-success" },
  error: { Icon: XCircle, className: "border-brand/40 bg-brand/10 text-brand" },
  info: { Icon: Info, className: "border-brand/40 bg-brand/10 text-brand" }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((current) => current.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const toast = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info")
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const { Icon, className } = variants[type] || variants.info;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                role="status"
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-soft backdrop-blur-xl ${className}`}
              >
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p className="flex-1 text-sm font-semibold text-content">{message}</p>
                <button onClick={() => remove(id)} aria-label="Dismiss" className="text-muted hover:text-content">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  // Safe no-op fallback so components don't crash if used outside the provider.
  return ctx || { success: () => {}, error: () => {}, info: () => {} };
};
