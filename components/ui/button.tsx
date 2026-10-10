import type { ButtonHTMLAttributes, ReactNode } from "react";
import Loader from "./loader";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  startIcon,
  endIcon,
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      data-auth-animation
      {...props}
      type={type}
      disabled={disabled || loading}
      className={[
        className,
        "cursor-pointer inline-flex w-full items-center justify-center gap-2",
        "px-4 py-3",
        "font-medium",
        "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
        variant === "primary" ? "bg-accent" : "bg-background-tertiary",
        variant === "primary" ? "text-white" : "text-text",
        "active:opacity-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "rounded-full",
      ].join(" ")}
    >
      {loading ? (
        <Loader size="sm" className="*:bg-white" />
      ) : (
        <>
          {startIcon ? (
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-full"
            >
              {startIcon}
            </span>
          ) : null}

          <span className="font-medium">{children}</span>

          {endIcon ? (
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-full"
            >
              {endIcon}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
}
