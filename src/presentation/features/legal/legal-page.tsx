import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { LogoMark, LogoWord } from "@/presentation/components/layout/logo";

export interface LegalSection {
  /** Numbered in the margin, so a clause can be cited by number. */
  heading: string;
  body: string[];
}

/**
 * A legal document is the one surface in RITM with no object in it: nothing here
 * is measured, so nothing here is drawn. It gets the treatment a printed clause
 * sheet gets — a single measured column, numbers in the margin, and hairlines
 * between the clauses. The material layer stays out of it on purpose (VISUAL-LAW §1:
 * body before shape, and there is no body here).
 */
export function LegalPage({
  title,
  summary,
  updated,
  sections,
}: {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-[100dvh] bg-bg text-fg">
      <header className="border-b border-border-soft">
        <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <LogoWord />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            الصفحة الرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-5 py-14">
        <p className="font-figure text-xs text-subtle">آخر تحديث {updated}</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-[1.2] tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-4 border-s-0 text-lg leading-relaxed text-muted">{summary}</p>

        <div className="mt-12 flex flex-col">
          {sections.map((section, i) => (
            <section
              key={section.heading}
              className="grid gap-x-6 gap-y-3 border-t border-border-soft py-8 sm:grid-cols-[3rem_1fr]"
            >
              {/* The clause number is a citation handle, not decoration: a merchant
                  asking "which clause?" needs an answer shorter than a sentence. */}
              <span className="font-figure text-sm text-subtle tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-fg">{section.heading}</h2>
                {section.body.map((p) => (
                  <p key={p} className="mt-3 leading-[1.85] text-muted">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border-soft">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-sm text-muted">
          <Link href="/legal/terms" className="transition-colors hover:text-fg">
            شروط الاستخدام
          </Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-fg">
            سياسة الخصوصية
          </Link>
          <Link href="/dashboard" className="ms-auto font-medium text-accent hover:underline">
            فتح التطبيق
          </Link>
        </div>
      </footer>
    </div>
  );
}
