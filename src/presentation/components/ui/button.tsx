"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/presentation/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "graphite" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/**
 * Buttons are FLAT PLATES, and the authority for that is the client's own actions
 * board (design-system/ritm/renders/d4-actions.png): a solid sand ground with dark
 * ink for the primary, a hairline over nothing for the secondary, text alone for
 * the tertiary, and a modest rounded rectangle under all of them.
 *
 * What was here before was a moulded body — a lighter rim, a lit top edge, a
 * shaded lower lip and a drop shadow the size of the button. It was drawn before
 * the boards were approved, it contradicts them, and once every panel around it
 * became one hairline on a flat ground it was the loudest object on every screen
 * in the product. The board wins.
 *
 * The radius is the ramp's `--radius-md`, not a pill: on the board a button is a
 * rectangle with its corners taken off, which is what lets a row of them read as
 * one control group instead of a string of lozenges.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-fill text-accent-fill-fg hover:bg-accent-fill-hover",
  secondary: "border border-line-strong bg-transparent text-fg hover:bg-surface-2",
  graphite: "bg-fg text-bg hover:opacity-90",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
  danger: "bg-danger text-paper hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-[var(--radius-md)]",
  md: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-base gap-2 rounded-[var(--radius-md)]",
  /* Square-ish, and the same corner as its siblings, so an icon-only action
     reads as one of the row rather than as a different kind of thing. */
  icon: "h-11 w-11 rounded-[var(--radius-md)]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Render the single child element with button styles (e.g. a Next <Link>). */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    asChild = false,
    children,
    ...props
  },
  ref,
) {
  const classes = cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
    "transition-[background-color,color,transform,opacity] duration-[var(--motion-fast)]",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
      children: (
        <>
          {loading ? <Spinner /> : leadingIcon}
          {child.props.children}
          {!loading && trailingIcon}
        </>
      ),
    });
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
