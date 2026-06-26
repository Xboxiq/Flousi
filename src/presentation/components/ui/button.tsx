"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/presentation/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-white [background-image:linear-gradient(180deg,var(--blue-400),var(--accent-strong))] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),var(--shadow-accent)] hover:brightness-[1.06]",
  secondary: "neu-raised-sm bg-surface text-fg hover:brightness-[0.99]",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  outline: "border border-border bg-surface text-fg hover:bg-surface-2",
  danger:
    "text-white [background-image:linear-gradient(180deg,#ff6b91,var(--danger))] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(225,29,84,0.5)] hover:brightness-[1.06]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
  icon: "size-11 rounded-full",
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
    "inline-flex select-none items-center justify-center font-medium",
    "transition-[background-color,color,transform,opacity] duration-[var(--motion-fast)]",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
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
