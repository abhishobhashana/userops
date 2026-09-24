"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
  closing?: boolean;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;
const TOAST_EXIT_DURATION = 280;

let nextToastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast,
      ),
    );

    const existingTimer = timers.current.get(id);

    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    const exitTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));

      timers.current.delete(id);
    }, TOAST_EXIT_DURATION);

    timers.current.set(id, exitTimer);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextToastId++;

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      const timer = window.setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);

      timers.current.set(id, timer);
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string) => {
      showToast("success", message);
    },
    [showToast],
  );

  const error = useCallback(
    (message: string) => {
      showToast("error", message);
    },
    [showToast],
  );

  const value = useMemo(
    () => ({
      success,
      error,
    }),
    [success, error],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-center px-4 pt-4 sm:px-6 lg:inset-x-auto lg:right-0 lg:justify-end lg:px-6"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={[
                "toast-item",
                toast.closing ? "toast-item-exit" : "",
                "pointer-events-auto relative overflow-hidden",
                "rounded-2xl border border-border/70",
                "bg-background-secondary/90",
                "px-4 py-3",
                "shadow-[0_18px_50px_rgba(0,0,0,0.14)]",
                "backdrop-blur-2xl",
                "supports-backdrop-filter:bg-background-secondary/75",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "material-symbols-rounded shrink-0 text-[20px]",
                    toast.type === "success" ? "text-green" : "text-red",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {toast.type === "success" ? "check_circle" : "error"}
                </span>

                <p className="min-w-0 flex-1 text-sm leading-5 text-foreground">
                  {toast.message}
                </p>

                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => removeToast(toast.id)}
                  className="material-symbols-rounded shrink-0 text-[18px] text-foreground-tertiary transition-colors duration-200 hover:text-foreground"
                >
                  close
                </button>
              </div>

              <span
                className={[
                  "toast-progress absolute inset-x-0 bottom-0 h-px",
                  "bg-foreground/15",
                  toast.closing ? "toast-progress-exit" : "",
                ].join(" ")}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes toast-enter-mobile {
          0% {
            opacity: 0;
            transform: translate3d(0, -18px, 0) scale(0.96);
            filter: blur(4px);
          }

          60% {
            opacity: 1;
            transform: translate3d(0, 2px, 0) scale(1.005);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes toast-enter-desktop {
          0% {
            opacity: 0;
            transform: translate3d(24px, -8px, 0) scale(0.96);
            filter: blur(4px);
          }

          60% {
            opacity: 1;
            transform: translate3d(-2px, 2px, 0) scale(1.005);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes toast-exit-mobile {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }

          100% {
            opacity: 0;
            transform: translate3d(0, -10px, 0) scale(0.97);
            filter: blur(3px);
          }
        }

        @keyframes toast-exit-desktop {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }

          100% {
            opacity: 0;
            transform: translate3d(18px, -4px, 0) scale(0.97);
            filter: blur(3px);
          }
        }

        @keyframes toast-progress {
          0% {
            transform: scaleX(1);
            transform-origin: left;
          }

          100% {
            transform: scaleX(0);
            transform-origin: left;
          }
        }

        @keyframes toast-progress-exit {
          0% {
            opacity: 0.4;
            transform: scaleX(0);
          }

          100% {
            opacity: 0;
            transform: scaleX(0);
          }
        }

        .toast-item {
          animation: toast-enter-mobile 460ms cubic-bezier(0.22, 1, 0.36, 1)
            both;
          will-change: transform, opacity, filter;
        }

        .toast-item-exit {
          animation: toast-exit-mobile 280ms cubic-bezier(0.4, 0, 1, 1) both;
          pointer-events: none;
        }

        .toast-progress {
          animation: toast-progress 4s linear both;
        }

        .toast-progress-exit {
          animation: toast-progress-exit 280ms ease-out both;
        }

        @media (min-width: 1024px) {
          .toast-item {
            animation-name: toast-enter-desktop;
          }

          .toast-item-exit {
            animation-name: toast-exit-desktop;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toast-item,
          .toast-item-exit,
          .toast-progress,
          .toast-progress-exit {
            animation: none;
          }
        }
      `}</style>
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
