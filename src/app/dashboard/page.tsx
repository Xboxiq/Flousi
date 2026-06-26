/**
 * Placeholder dashboard route created during Phase 4 (Foundation) so the app
 * boots and routing/tokens can be verified. Replaced with the full dashboard
 * in Phase 8.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-center px-4 md:px-8">
      <div className="max-w-xl">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
          Foundation ready
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-fg">Flousi</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          The design system, theme engine, and Clean Architecture foundation are in place.
          The full dashboard lands in a later build phase.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <TokenSwatch label="Surface" className="bg-surface border border-border" />
          <TokenSwatch label="Accent" className="bg-accent" />
          <TokenSwatch label="Success" className="bg-success" />
          <TokenSwatch label="Danger" className="bg-danger" />
          <TokenSwatch label="Warning" className="bg-warning" />
          <TokenSwatch label="Surface 2" className="bg-surface-2 border border-border" />
        </div>
      </div>
    </main>
  );
}

function TokenSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-14 rounded-[var(--radius-md)] shadow-sm ${className}`} />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
