import type { ButtonHTMLAttributes } from "react";
import { Loader } from "../ui/loader";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthButton({
  children,
  loading = false,
  disabled,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      data-auth-animation
      {...props}
      disabled={disabled || loading}
      className={[
        className,
        "w-full rounded-xl px-4 py-2.5",
        "font-medium",
        "transition-[transform,opacity] duration-200",
        "bg-accent text-white",
        "hover:opacity-90",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
      ].join(" ")}
    >
      {loading ? <Loader size="sm" className="*:bg-white" /> : children}
    </button>
  );
}
