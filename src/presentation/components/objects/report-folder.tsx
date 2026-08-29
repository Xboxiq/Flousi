import { cn } from "@/presentation/lib/cn";

interface ReportFolderProps {
  /** How many filed documents the folder holds (closed periods). */
  sheets: number;
  className?: string;
}

/** No two sheet angles equal, none zero — an equal angle reads as a bug (§4). */
const SHEET_POSES = [
  { rotate: -3.5, rise: 10 },
  { rotate: 2, rise: 5 },
  { rotate: -0.8, rise: 0 },
] as const;

/**
 * The document folder (RECIPES R30, second feedback batch): where the store's
 * filed months live.
 *
 * The sheets are state-bound detail (§8): they exist only when something has
 * actually been filed, and their count chip is the real number of closed
 * periods. An empty folder is visibly empty — that emptiness is the message.
 */
export function ReportFolder({ sheets, className }: ReportFolderProps) {
  const visible = Math.min(sheets, SHEET_POSES.length);

  return (
    <div className={cn("folder", className)} aria-hidden data-part="folder">
      <div className="folder-back" />
      {SHEET_POSES.slice(0, visible).map((pose, i) => (
        <div
          key={i}
          className="folder-sheet"
          style={{ transform: `translateY(-${pose.rise}px) rotate(${pose.rotate}deg)` }}
        >
          {/* a filed sheet carries its print — blank white paper is a prop */}
          <div className="mt-2 ms-2.5 h-1 w-1/2 rounded-full bg-[rgba(18,26,38,0.14)]" />
          <div className="mt-1.5 ms-2.5 h-1 w-1/3 rounded-full bg-[rgba(18,26,38,0.09)]" />
        </div>
      ))}
      <div className="folder-front" />
      {sheets > 0 && (
        <span className="dock absolute -bottom-2 -end-2 z-10 flex h-7 min-w-7 items-center justify-center px-1.5 text-[12px] font-bold text-fg">
          <bdi dir="ltr" className="font-figure tabular-nums">
            {sheets}
          </bdi>
        </span>
      )}
    </div>
  );
}
