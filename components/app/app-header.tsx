import type { ReactNode } from "react";

interface AppHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function AppHeader({
  title,
  description,
  actions,
}: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-foreground">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
