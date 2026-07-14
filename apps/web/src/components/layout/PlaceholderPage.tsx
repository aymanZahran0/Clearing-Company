// Temporary stand-in for routes not yet implemented as of the current
// Phase. Each usage below is replaced by its real page component in the
// User Story phase named in the comment at the call site.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  );
}
