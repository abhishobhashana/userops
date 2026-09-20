interface AuthHeadingProps {
  title: string;
  description?: string;
}

export default function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header data-auth-animation className="mt-6 mb-10">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>

      {description && (
        <h4 className="max-w-152 text-foreground-tertiary">{description}</h4>
      )}
    </header>
  );
}
