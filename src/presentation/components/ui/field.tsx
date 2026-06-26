import { cn } from "@/presentation/lib/cn";

interface FieldProps {
  label?: string;
  htmlFor?: string;
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
  helper,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
          {required && <span className="ms-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : helper ? (
        <p className="text-sm text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
