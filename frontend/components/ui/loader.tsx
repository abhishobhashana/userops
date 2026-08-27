import type { CSSProperties } from "react";

type LoaderSize = "sm" | "md" | "lg";

interface LoaderProps {
  size?: LoaderSize;
  className?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: "size-5",
  md: "size-7",
  lg: "size-10",
};

export function Loader({ size = "md", className = "" }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`relative inline-block shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {Array.from({ length: 8 }).map((_, index) => {
        const rotation = index * 45;
        const delay = -0.8 + index * 0.12;

        return (
          <span
            key={index}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[25%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground-secondary opacity-0 animate-loader-fade"
            style={
              {
                transform: `rotate(${rotation}deg) translate(0, -100%)`,
                animationDelay: `${delay}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
