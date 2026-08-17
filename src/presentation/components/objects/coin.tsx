"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/presentation/lib/cn";

interface CoinProps {
  /** Rendered diameter in px. */
  size?: number;
  /** Glyph struck into the face. Default: the Iraqi dinar mark. */
  glyph?: string;
  /** Profit polarity tints the rim light: >0 mints bright, <0 tarnishes. */
  polarity?: number;
  className?: string;
}

const TILT = 6; // degrees — MASTER §4 caps pointer tilt at 6°

/**
 * العملة — Flousi's brand object (SIGNATURE.md #2, VISUAL-LAW §1 §2 §3 §5).
 *
 * Not a circle with a gradient: a struck body. Cooperating light layers —
 * (1) minted body radial, (2) reeded edge from a conic ring masked to an
 * annulus, (3) fixed overhead gloss, (4) pointer-tracked specular sweep,
 * (5) engraved glyph (dark above / light below) — plus all three shadow roles
 * (contact, cast, occlusion) as named parts a design-law gate can read.
 * Light is overhead only, so the RTL mirror can never flip its physics.
 * Minted in brand steel-blue, deliberately not fintech gold.
 */
export function Coin({ size = 148, glyph = "د.ع", polarity = 1, className }: CoinProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [pointer, setPointer] = useState({ mx: 50, my: 26, rx: 0, ry: 0 });

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduce || e.pointerType !== "mouse") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() =>
        setPointer({
          mx: px * 100,
          my: py * 100,
          ry: (px - 0.5) * 2 * TILT,
          rx: (0.5 - py) * 2 * TILT,
        }),
      );
    },
    [reduce],
  );

  const onLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    setPointer({ mx: 50, my: 26, rx: 0, ry: 0 });
  }, []);

  const tarnished = polarity < 0;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size * 1.12 }}
      data-part="stage"
    >
      {/* cast shadow — reports height (VISUAL-LAW §3) */}
      <span
        data-part="cast-shadow"
        aria-hidden
        className="absolute inset-x-[8%] bottom-0 h-[10%] rounded-[50%] blur-md transition-opacity duration-[var(--motion-base)]"
        style={{ background: "rgb(18 26 38 / 0.26)" }}
      />
      {/* contact shadow — pins it to the ground; tightens as the coin settles */}
      <span
        data-part="contact-shadow"
        aria-hidden
        className="absolute inset-x-[26%] bottom-[2%] h-[4%] rounded-[50%] blur-[3px]"
        style={{ background: "rgb(18 26 38 / 0.45)" }}
      />

      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="absolute inset-x-0 top-0 aspect-square rounded-full transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)]"
        style={
          {
            "--mx": `${pointer.mx}%`,
            "--my": `${pointer.my}%`,
            transform: reduce
              ? undefined
              : `perspective(720px) rotateX(${pointer.rx}deg) rotateY(${pointer.ry}deg)`,
            // (1) minted body: overhead highlight → mid steel → dark lower edge
            backgroundImage: tarnished
              ? "radial-gradient(circle at 50% 16%, #ffd9d5 0%, #ff8a82 26%, #d8352c 62%, #7d1a15 100%)"
              : "radial-gradient(circle at 50% 16%, #eaf3ff 0%, #9dc2ff 24%, #2f6bff 58%, #0a3f9e 100%)",
            boxShadow:
              "var(--shadow-occlusion), inset 0 -10px 22px rgb(4 20 56 / 0.5), inset 0 8px 16px rgb(255 255 255 / 0.34)",
          } as React.CSSProperties
        }
      >
        {/* (2) reeded edge: conic ring masked to an annulus — detail at the edge */}
        <span
          data-part="edge"
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              "repeating-conic-gradient(from 0deg, rgb(255 255 255 / 0.5) 0deg 1.6deg, rgb(6 24 64 / 0.42) 1.6deg 3.2deg)",
            mask: "radial-gradient(circle, transparent 87%, black 89%, black 100%)",
            WebkitMask: "radial-gradient(circle, transparent 87%, black 89%, black 100%)",
            opacity: 0.85,
          }}
        />
        {/* inner field: the struck plateau, seated by its own occlusion ring */}
        <span
          data-part="occlusion"
          aria-hidden
          className="absolute inset-[11%] rounded-full"
          style={{
            backgroundImage: tarnished
              ? "radial-gradient(circle at 50% 22%, #ff9e97 0%, #e2453c 55%, #96201a 100%)"
              : "radial-gradient(circle at 50% 22%, #cfe2ff 0%, #3f7cff 52%, #0b47ad 100%)",
            boxShadow:
              "inset 0 3px 6px rgb(4 20 56 / 0.42), inset 0 -3px 6px rgb(255 255 255 / 0.28), 0 1px 0 rgb(255 255 255 / 0.3)",
          }}
        />
        {/* (5) engraved glyph: shadow above, light below — a cut, not a print */}
        <span
          data-part="engrave"
          className="absolute inset-0 flex items-center justify-center font-display font-black text-white/85 select-none"
          style={{
            fontSize: size * 0.3,
            textShadow:
              "0 -1px 1px rgb(4 20 56 / 0.75), 0 1px 0 rgb(255 255 255 / 0.45), 0 0 14px rgb(10 108 255 / 0.35)",
          }}
        >
          {glyph}
        </span>
        {/* (3) fixed overhead gloss — the light source, never lateral */}
        <span
          data-part="gloss"
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              "radial-gradient(58% 34% at 50% 8%, rgb(255 255 255 / 0.72), transparent 72%)",
          }}
        />
        {/* (4) pointer-tracked specular sweep — reads as polished metal */}
        <span
          data-part="specular"
          aria-hidden
          className="absolute inset-0 rounded-full mix-blend-overlay"
          style={{
            backgroundImage:
              "conic-gradient(from 120deg at var(--mx) var(--my), transparent, rgb(255 255 255 / 0.55), transparent 24%)",
          }}
        />
      </div>
    </div>
  );
}
