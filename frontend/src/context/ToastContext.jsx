import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  // Replace default browser window.alert so no ugly "says" popups can ever appear anywhere on the site
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      if (!msg) return;
      const str = String(msg);
      const isError = /error|fail|cannot|invalid|required|denied|less than|exceed/i.test(str);
      const isSuccess = /success|approved|verified|saved|updated|created|added/i.test(str);
      const type = isError ? 'error' : isSuccess ? 'success' : 'info';
      addToast(str, type, 3500);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              t.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-900/10'
                : t.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-rose-900/10'
                : t.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-900/10'
                : 'bg-white/95 border-gray-200 text-gray-900 shadow-gray-900/10'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
              {t.type === 'error' && <AlertCircle size={18} className="text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-600" />}
              {t.type === 'info' && <Info size={18} className="text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed break-words">
              {t.message}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
