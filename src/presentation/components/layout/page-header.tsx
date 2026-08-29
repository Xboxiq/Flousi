"use client";

import { usePublishChrome } from "./page-chrome";

interface PageHeaderProps {
  /** The screen's name — the last crumb in the top bar. */
  title: string;
  /** The section it sits in. Defaults to the nav group the route belongs to. */
  section?: string;
  /** The screen's actions, drawn at the end of the top bar. */
  actions?: React.ReactNode;
}

/**
 * A screen's header, which is no longer drawn inside the screen.
 *
 * This renders NOTHING. It hands the top bar a breadcrumb and a set of actions,
 * and the top bar draws them — the structure the artboards specify, where the
 * content column starts with the first card instead of with a title that repeats
 * the nav item the merchant just pressed.
 *
 * The old `description` prop is gone rather than ignored. Every one of its uses
 * was atmosphere («رقمك الأول، وتحت كل درجة تفصيلها.») rather than something the
 * merchant needed in order to use the screen; where a screen genuinely has to
 * explain itself, the explanation now sits inside the card it is about, which is
 * where it can be read next to the thing it explains.
 */
export function PageHeader({ title, section, actions }: PageHeaderProps) {
  usePublishChrome({ title, section, actions });
  return null;
}
