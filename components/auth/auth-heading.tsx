interface AuthHeadingProps {
  title: string;
  description?: string;
}

export default function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header data-auth-animation className="mt-6 mb-10">
      <h1 className="lg:text-2xl md:text-3xl text-3xl font-bold">{title}</h1>

      {description && (
        <h4 className="mt-1 max-w-152 font-medium text-text-secondary">
          {description}
        </h4>
      )}
    </header>
  );
}
