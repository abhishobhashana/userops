"use client";

import { useState } from "react";

interface TextfieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  info?: string;
  error?: string;
}

export default function Textfield({
  label,
  info,
  error,
  type = "text",
  id,
  ...props
}: TextfieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div data-auth-animation className="space-y-2">
      <label htmlFor={id} className="block text-foreground">
        {label}
      </label>

      <div className="relative mb-1">
        <input
          {...props}
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "w-full rounded-xl bg-background-secondary px-3.5 py-2.5",
            "text-foreground outline-none",
            "placeholder:text-foreground-tertiary",
            "transition-[border-color,box-shadow] duration-200",
            "focus:border-accent",
            "focus:ring-3 focus:ring-accent focus:outline-none!",
            error ? "ring-3 ring-red outline-none! pr-12" : "border-border",
            isPassword ? "pr-12" : "",
          ].join(" ")}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center text-foreground-tertiary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span
              className={[
                "material-symbols-rounded absolute",
                "transition-all duration-300 ease-out",
                showPassword
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-90 -rotate-12 opacity-0",
              ].join(" ")}
            >
              visibility_lock
            </span>

            <span
              className={[
                "material-symbols-rounded absolute",
                "transition-all duration-300 ease-out",
                showPassword
                  ? "scale-90 rotate-12 opacity-0"
                  : "scale-100 rotate-0 opacity-100",
              ].join(" ")}
            >
              visibility
            </span>
          </button>
        )}
      </div>

      {info && (
        <p className="px-3.5 text-xs text-foreground-tertiary">{info}</p>
      )}

      {error && (
        <p id={`${id}-error`} className="px-3.5 text-xs text-red">
          {error}
        </p>
      )}
    </div>
  );
}
