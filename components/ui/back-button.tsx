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
        "liquid-glass",
        "flex w-fit items-center justify-center",
        "transform-gpu touch-manipulation transition-transform duration-200 ease-out",
        "active:scale-110",
        "rounded-3xl",
        "px-2.5 py-3",
        "transition-transform duration-200 ease-out",
      ].join(" ")}
    >
      <span className="material-symbols-rounded text-[17px]! pl-1.5">
        arrow_back_ios
      </span>
    </Link>
  );
}
