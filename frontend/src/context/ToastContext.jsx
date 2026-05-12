import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800"
  },
  error: {
    container: "border-rose-200 bg-rose-50 text-rose-900",
    badge: "bg-rose-100 text-rose-800"
  },
  info: {
    container: "border-sky-200 bg-sky-50 text-sky-900",
    badge: "bg-sky-100 text-sky-800"
  }
};

const buildToast = (message, options = {}) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  message,
  type: options.type || "info",
  title: options.title || "",
  duration: options.duration ?? 3200
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, options = {}) => {
      const toast = buildToast(message, options);
      setToasts((prev) => [...prev, toast]);

      if (toast.duration > 0) {
        window.setTimeout(() => dismiss(toast.id), toast.duration);
      }

      return toast.id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      success: (message, options = {}) => push(message, { ...options, type: "success" }),
      error: (message, options = {}) => push(message, { ...options, type: "error" }),
      info: (message, options = {}) => push(message, { ...options, type: "info" }),
      dismiss
    }),
    [dismiss, push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end">
        <div className="w-full max-w-sm space-y-2">
          {toasts.map((toast) => {
            const tone = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto rounded-xl border px-3 py-3 shadow-soft ${tone.container}`}
                role="status"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {toast.title && (
                      <p className={`mb-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${tone.badge}`}>
                        {toast.title}
                      </p>
                    )}
                    <p className="text-sm font-medium">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md px-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    onClick={() => dismiss(toast.id)}
                  >
                    x
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
