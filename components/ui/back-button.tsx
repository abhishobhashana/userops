import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({
  href = "",
  label = "back",
}: BackButtonProps) {
  return (
    <Link
      data-auth-animation
      href={href}
      aria-label={label}
      className={[
        "flex w-fit items-center justify-center",
        "rounded-full bg-background-secondary",
        "p-3 pr-2.5",
        "shadow-lg",
        "transform-gpu touch-manipulation transition-transform duration-200 ease-out",
        "active:scale-90",
      ].join(" ")}
    >
      <span className="material-symbols-rounded text-[16px]! pl-1">
        arrow_back_ios
      </span>
    </Link>
  );
}
