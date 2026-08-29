"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * What a screen tells the chrome about itself.
 *
 * On the artboards there is no page `<h1>` inside the content at all: the top bar
 * carries WHERE YOU ARE (a breadcrumb) and WHAT YOU CAN DO HERE (the actions),
 * and the content starts immediately with the cards. That is not decoration — it
 * buys back a whole band of vertical space on a 900px laptop, and it stops every
 * screen from opening with a title that repeats the nav item you just clicked.
 *
 * So a screen no longer renders its own header; it DECLARES one, and the top bar
 * draws it. `<PageHeader>` is the declaration.
 */
export interface PageChrome {
  /** The section this screen belongs to — the first crumb. */
  section?: string;
  /** The screen itself — the last crumb, and the document's own name. */
  title: string;
  /** The screen's actions, drawn at the end of the top bar. */
  actions?: React.ReactNode;
}

interface ChromeStore {
  chrome: PageChrome | null;
  /** Returns a release function; only the CURRENT owner may clear. */
  claim: (chrome: PageChrome) => () => void;
}

const Ctx = createContext<ChromeStore | null>(null);

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChrome] = useState<PageChrome | null>(null);
  /* A route change mounts the next screen before it unmounts the previous one,
     so a naive cleanup would clear the chrome the NEW screen just set and leave
     the top bar empty. The token makes ownership explicit: a release only takes
     effect while the releasing screen is still the one on display. */
  const owner = useRef(0);

  const value = useMemo<ChromeStore>(
    () => ({
      chrome,
      claim(next) {
        const token = ++owner.current;
        setChrome(next);
        return () => {
          if (owner.current === token) setChrome(null);
        };
      },
    }),
    [chrome],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** What the top bar draws. Null outside the app shell (the landing page). */
export function usePageChrome(): PageChrome | null {
  return useContext(Ctx)?.chrome ?? null;
}

/**
 * Declare this screen's chrome. Renders nothing.
 *
 * `actions` is a node, so it is re-claimed whenever the screen re-renders — that
 * is deliberate: a button whose disabled state depends on the screen's data has
 * to follow it. The claim is cheap (one `setState` with an equal-by-identity
 * check upstream), and the alternative — a memoised snapshot — is how a Save
 * button ends up permanently greyed out after the form becomes valid.
 */
export function usePublishChrome(chrome: PageChrome): { hasShell: boolean } {
  const store = useContext(Ctx);
  const { section, title, actions } = chrome;
  useEffect(() => {
    if (!store) return;
    return store.claim({ section, title, actions });
    /* `store.claim` is stable per provider; `actions` is a fresh node each render,
       which is what keeps a data-dependent action in sync. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, title, actions]);
  return { hasShell: store !== null };
}
