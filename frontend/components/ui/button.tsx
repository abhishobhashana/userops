import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Button({
  children,
  startIcon,
  endIcon,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`cursor-pointer inline-flex w-full items-center justify-center gap-2 py-2 rounded-full border-0 bg-accent text-white transition-[transform,background-color,opacity] duration-200 ease-out hover:bg-accent-hover active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4 motion-reduce:transition-none ${className}`}
    >
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
    </button>
  );
}
