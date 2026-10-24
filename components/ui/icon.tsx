type IconProps = {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  className?: string;
};

export default function Icon({
  name,
  size = 20,
  fill = false,
  weight = 400,
  className = "",
}: IconProps) {
  return (
    <span
      className={`material-symbols-rounded inline-flex items-center justify-center leading-none! ${className}`}
      style={{
        fontSize: `var(--icon-size, ${size}px)`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden="true"
    >
      {name}
      <style>{`
        @media (max-width: 640px) {
          .material-symbols-rounded {
            --icon-size: ${size + 8}px;
          }
        }
      `}</style>
    </span>
  );
}
