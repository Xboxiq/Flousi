"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/presentation/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "graphite" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

/**
 * Buttons are moulded bodies (see `.molded*` in materials.css): a lighter rim
 * around the fill, a lit top edge, a shaded lower lip, and a shadow the size of
 * the body — pressing travels the body down into that shadow. Ghost and outline
 * stay flat on purpose: they are not objects, they are text with a hit area.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "molded molded-accent text-accent-fg",
  secondary: "molded molded-quiet text-fg",
  graphite: "molded molded-graphite text-white",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
  danger: "molded molded-danger text-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
  /* A key, not a bubble: the reference action rows set icon-only actions as
     squircles slightly wider than tall, so they read as siblings of the pill. */
  icon: "h-11 w-[54px] rounded-[18px]",
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
  const flat = variant === "ghost" || variant === "outline";
  const classes = cn(
    "inline-flex select-none items-center justify-center font-semibold",
    "transition-[background-color,color,transform,opacity] duration-[var(--motion-fast)]",
    flat && "active:scale-[0.98]",
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
