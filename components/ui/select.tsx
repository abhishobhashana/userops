"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import Icon from "./icon";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = {
  className?: string;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  name?: string;
  animation?: "list" | "bubble";
};

export default function Select({
  className,
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  disabled = false,
  error,
  name,
  animation = "bubble",
}: SelectProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="w-full">
      {label ? (
        <label className="mb-1.5 block text-sm font-medium text-text-quaternary">
          {label}
        </label>
      ) : null}

      <Listbox
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        invalid={Boolean(error)}
      >
        <div className="relative">
          <ListboxButton
            aria-label={label ? undefined : placeholder}
            className={`${className} flex w-full items-center justify-between gap-2 rounded-3xl border bg-background-secondary px-4 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:bg-background-tertiary disabled:text-text-quaternary ${
              error ? "border-red" : "border-transparent"
            }`}
          >
            <span className="min-w-0 truncate text-text-secondary">
              {selectedOption?.label ?? placeholder}
            </span>

            <Icon
              name="keyboard_arrow_down"
              size={20}
              className="text-text-quaternary"
            />
          </ListboxButton>

          <ListboxOptions
            anchor={animation === "list" ? "bottom end" : "bottom"}
            transition
            className={`z-50 mt-1 max-h-60 w-(--button-width) overflow-auto rounded-3xl border border-border bg-background-secondary/90 p-2.5 shadow-xl backdrop-blur-md outline-none transition-[opacity,transform,scale] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] data-closed:scale-0 data-closed:opacity-80 data-closed:translate-x-0  data-closed:translate-y-0 ${
              animation === "list" ? `origin-top-right` : `origin-top`
            }`}
          >
            {options.length > 0 ? (
              options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="group flex cursor-pointer items-center gap-1.5 rounded-2xl px-0 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 data-focus:text-text"
                >
                  <Icon
                    name="check"
                    size={20}
                    className="invisible shrink-0 text-text group-data-selected:visible"
                    aria-hidden="true"
                  />

                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                </ListboxOption>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-text-quaternary">
                No options available
              </div>
            )}
          </ListboxOptions>
        </div>
      </Listbox>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
