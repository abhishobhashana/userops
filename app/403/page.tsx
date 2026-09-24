export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm text-foreground-tertiary">Error 403</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Access denied
        </h1>

        <p className="mt-3 text-sm text-foreground-secondary">
          You do not have permission to access this page.
        </p>
      </div>
    </main>
  );
}
