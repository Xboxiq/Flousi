import { cn } from "@/presentation/lib/cn";

interface FieldProps {
  label?: string;
  htmlFor?: string;
  /**
   * The control is a GROUP (a Segmented row, a tile set), not a single input.
   * `<label for>` cannot name a group, so the label renders as a <span> with an
   * id and the group points at it with aria-labelledby.
   */
  labelsGroup?: boolean;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Form field wrapper enforcing the design-system rule:
 * label ABOVE, helper/error BELOW. Never placeholder-as-label.
 */
export function Field({
  label,
  htmlFor,
  labelsGroup,
  helper,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label &&
        (labelsGroup ? (
          <span id={htmlFor ? `${htmlFor}-label` : undefined} className="text-sm font-medium text-fg">
            {label}
            {required && <span className="ms-0.5 text-danger">*</span>}
          </span>
        ) : (
          <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
            {label}
            {required && <span className="ms-0.5 text-danger">*</span>}
          </label>
        ))}
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : helper ? (
        <p className="text-sm text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
