"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, type ReactNode } from "react";

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
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop
            className="fixed inset-0 backdrop-blur-sm bg-black/60 ease-out duration-300 data-closed:opacity-0 transition-opacity"
            aria-hidden="true"
          />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="transform transition-all ease-out duration-200"
          enterFrom="scale-95 opacity-0"
          enterTo="scale-100 opacity-100"
          leave="transform transition-all ease-in duration-100"
          leaveFrom="scale-100 opacity-100"
          leaveTo="scale-[0.98] opacity-0"
        >
          <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
            <DialogPanel
              className={[
                "liquid-glass",
                "relative w-full max-w-sm m-4",
                "overflow-hidden rounded-[2.5rem]",
                "transform transition ease-in-out duration-300",
                "data-closed:translate-y-full data-closed:opacity-75",
                className,
              ].join(" ")}
            >
              {(title || description) && (
                <div className="flex flex-col gap-4 p-7">
                  {title && (
                    <DialogTitle className="font-semibold">{title}</DialogTitle>
                  )}

                  {description && <Description>{description}</Description>}
                </div>
              )}

              <div className="p-4.5 pt-0">{children}</div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
