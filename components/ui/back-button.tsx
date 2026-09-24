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
        "transform-gpu touch-manipulation transition-transform duration-200 ease-out",
        "active:opacity-85",
      ].join(" ")}
    >
      <span className="material-symbols-rounded text-[16px]! pl-1 text-accent">
        arrow_back_ios
      </span>
      <span className="text-accent">Back</span>
    </Link>
  );
}
