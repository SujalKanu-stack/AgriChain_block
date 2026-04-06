import React, { createContext, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  };

  const value = useMemo(
    () => ({
      success: (message) => showToast(message, "success"),
      error: (message) => showToast(message, "error"),
      info: (message) => showToast(message, "info"),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
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

function Toast({ toast, onClose }) {
  const config = {
    success: { icon: CheckCircle, className: "toast-success" },
    error: { icon: AlertCircle, className: "toast-error" },
    info: { icon: Info, className: "toast-info" },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div className={`toast ${config.className}`}>
      <Icon size={18} />
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
