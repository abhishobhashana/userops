import Link from "next/link";

interface BackButtonProps {
  href?: string;
}

export default function BackButton({ href = "" }: BackButtonProps) {
  return (
    <Link
      data-auth-animation
      href={href}
      aria-label="Back"
      className={[
        "flex w-fit items-center justify-center",
        "transform-gpu touch-manipulation transition-transform duration-200 ease-out",
        "active:scale-110",
        "bg-background-secondary/5",
        "backdrop-blur-xl",
        "rounded-full",
        "px-2.5 py-3",
        "border border-border/50",
        "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_1px_rgba(255,255,255,0.5)]",
        "transition-transform duration-200 ease-out",
      ].join(" ")}
    >
      <span className="material-symbols-rounded text-[17px]! pl-1.5">
        arrow_back_ios
      </span>
    </Link>
  );
}
