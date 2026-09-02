import { cn } from "@/presentation/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Primary action (e.g. a Button). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Composed empty state that always points to the next action.
 *
 * The subject stands as an OBJECT on a stage (batch-3 feedback: the 3D squircle
 * icon on a tinted pool): a moulded body under overhead light, pinned by a
 * contact/cast floor — not a flat icon in a grey disc (§1 §3). The emptiness
 * itself is the message, so the stage stays sparse on purpose.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      {/* The icon, and nothing under it. It was a 3D squircle standing on a lit
          stage floor — two objects drawn to hold one glyph, and the pastel icon
          tile is a named anti-pattern in this project's own gate. */}
      {icon && <div className="mb-5 text-subtle [&>svg]:size-11">{icon}</div>}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
