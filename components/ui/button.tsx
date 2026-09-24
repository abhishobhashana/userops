import type { ButtonHTMLAttributes, ReactNode } from "react";
import Loader from "./loader";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  rounded?: boolean;
}

export default function Button({
  children,
  startIcon,
  endIcon,
  rounded = false,
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
        "px-3.5 py-2.5",
        "font-medium",
        "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
        "bg-accent hover:bg-accent-hover active:scale-[0.985] hover:opacity-90",
        "text-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        rounded ? "rounded-full" : "rounded-xl",
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

          <span>{children}</span>

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
