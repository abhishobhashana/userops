type IconProps = {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  className?: string;
};

export default function Icon({
  name,
  size = 22,
  fill = false,
  weight = 300,
  className = "",
}: IconProps) {
  return (
    <span
      className={`material-symbols-rounded flex! items-center justify-center leading-none! ${className}`}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
