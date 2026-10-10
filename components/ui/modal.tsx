"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 6,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.8,
            }}
            className={[
              "liquid-glass",
              "relative z-10 w-full max-w-sm",
              "overflow-hidden rounded-4xl",
              className,
            ].join(" ")}
            onClick={(event) => event.stopPropagation()}
          >
            {(title || description) && (
              <div className="p-6 pb-0">
                {title && (
                  <h3 id="modal-title" className="font-semibold">
                    {title}
                  </h3>
                )}

                {description && (
                  <p id="modal-description" className="mt-1.5">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
