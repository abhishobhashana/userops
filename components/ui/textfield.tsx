"use client";

import { useState } from "react";
import Icon from "./icon";

interface TextfieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  info?: string;
  error?: string;
  className?: string;
  clearable?: boolean;
  searchable?: boolean;
  onClear?: () => void;
}

export default function Textfield({
  className,
  label,
  info,
  error,
  type = "text",
  id,
  clearable = false,
  searchable = false,
  onClear,
  value,
  defaultValue,
  onChange,
  ...props
}: TextfieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? ""),
  );

  const isPassword = type === "password";
  const isControlled = value !== undefined;

  const currentValue = isControlled ? String(value ?? "") : internalValue;

  const inputType = isPassword && showPassword ? "text" : type;
  const showClear = clearable && currentValue.length > 0;

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    onClear?.();
  };

  return (
    <div data-auth-animation className="space-y-2">
      {label && (
        <label htmlFor={id} className="px-4 block text-foreground">
          {label}
        </label>
      )}

      <div className="relative mb-1">
        {searchable && (
          <span className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center pointer-events-none">
            <Icon name="search" />
          </span>
        )}

        <input
          {...props}
          id={id}
          type={inputType}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={(event) => {
            if (!isControlled) {
              setInternalValue(event.target.value);
            }

            onChange?.(event);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            className,
            "w-full rounded-3xl bg-background-secondary px-4 py-3",
            "text-text outline-none",
            "placeholder:text-text-secondary",
            "transition-[border-color,box-shadow] duration-200",
            "focus:border-accent",
            "focus:ring-3 focus:ring-accent focus:outline-none!",
            error ? "ring-3 ring-red outline-none! pr-12" : "border-border",
            searchable ? "pl-12" : "",
            showClear || isPassword ? "pr-12" : "",
          ].join(" ")}
        />

        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className={[
              "absolute top-1/2 flex size-8",
              "-translate-y-1/2 cursor-pointer items-center justify-center",
              "text-text-tertiary transition-colors",
              isPassword ? "right-11" : "right-3",
            ].join(" ")}
            aria-label="Clear input"
          >
            <Icon name="cancel" fill />
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-text-tertiary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon
              name="visibility_lock"
              size={22}
              className={[
                "absolute transition-all duration-300 ease-out",
                showPassword
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-90 -rotate-12 opacity-0",
              ].join(" ")}
            />

            <Icon
              name="visibility"
              size={22}
              className={[
                "absolute transition-all duration-300 ease-out",
                showPassword
                  ? "scale-90 rotate-12 opacity-0"
                  : "scale-100 rotate-0 opacity-100",
              ].join(" ")}
            />
          </button>
        )}
      </div>

      {info && (
        <p className="px-4 font-medium text-xs text-text-secondary">{info}</p>
      )}

      {error && (
        <p id={`${id}-error`} className="px-4 font-medium text-xs text-red">
          {error}
        </p>
      )}
    </div>
  );
}
