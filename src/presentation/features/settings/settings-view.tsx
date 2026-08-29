"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  DownloadSimple,
  UploadSimple,
  FloppyDisk,
  Sun,
  Moon,
  Desktop,
  Warning,
} from "@phosphor-icons/react";
import type { AppSettings } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useTheme, type ThemePreference } from "@/presentation/components/theme/theme-provider";
import {
  downloadBackup,
  importAll,
  clearAll,
} from "@/infrastructure/persistence/local-storage/backup";
import { PageHeader } from "@/presentation/components/layout/page-header";
import { Button, Dialog, Field, Input, Segmented, Select, Skeleton } from "@/presentation/components/ui";
import { Grid, Panel } from "@/presentation/components/structure";
import { cn } from "@/presentation/lib/cn";

const CURRENCIES = [
  { label: "دينار عراقي (IQD)", value: "IQD" },
  { label: "دولار أمريكي (USD)", value: "USD" },
  { label: "يورو (EUR)", value: "EUR" },
  { label: "ريال سعودي (SAR)", value: "SAR" },
  { label: "درهم إماراتي (AED)", value: "AED" },
  { label: "جنيه مصري (EGP)", value: "EGP" },
];
const LOCALES = [
  { label: "العراق (ar-IQ)", value: "ar-IQ" },
  { label: "السعودية (ar-SA)", value: "ar-SA" },
  { label: "مصر (ar-EG)", value: "ar-EG" },
  { label: "الإنجليزية (en-US)", value: "en-US" },
];
const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "العربية", value: "ar" },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "فاتح", icon: <Sun size={16} /> },
  { value: "dark", label: "داكن", icon: <Moon size={16} /> },
  { value: "system", label: "تلقائي", icon: <Desktop size={16} /> },
];

/**
 * The screen is split in two so the form can never initialise from an unhydrated
 * store.
 *
 * `useState(settings)` captures its value on the FIRST render, and on that render
 * the store still holds its defaults — so the draft was IQD / ar-IQ regardless of
 * what the merchant had saved, and pressing «حفظ التغييرات» before hydration wrote
 * those defaults over his real settings. That is the same trap P3 documented on
 * the targets screen, and the same fix: never seed state from async data. Mounting
 * the form only once `loaded` is true means its initial value IS the stored one.
 */
export function SettingsView() {
  const loaded = useDataStore((s) => s.loaded);

  if (!loaded) {
    return (
      <>
        <PageHeader title="الإعدادات" />
        <Grid>
          <Skeleton className="span-6 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-3 h-[200px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-6 h-[240px] rounded-[var(--radius-md)]" />
          <Skeleton className="span-6 h-[240px] rounded-[var(--radius-md)]" />
        </Grid>
      </>
    );
  }
  return <SettingsForm />;
}

function SettingsForm() {
  const settings = useDataStore((s) => s.settings);
  const saveSettings = useDataStore((s) => s.saveSettings);
  const reload = useDataStore((s) => s.reload);
  const { preference, setPreference } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const setCost = (key: keyof AppSettings["defaultCosts"], value: number) =>
    setDraft((d) => ({ ...d, defaultCosts: { ...d.defaultCosts, [key]: value } }));

  const onSave = async () => {
    await saveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onRestoreFile = async (file: File) => {
    try {
      const text = await file.text();
      importAll(JSON.parse(text));
      await reload();
      setDraft(useDataStore.getState().settings);
      setMessage({ tone: "success", text: "تمت استعادة النسخة الاحتياطية بنجاح." });
    } catch (err) {
      setMessage({
        tone: "danger",
        text: err instanceof Error ? err.message : "تعذّر استعادة النسخة الاحتياطية.",
      });
    }
  };

  const onReset = () => {
    clearAll();
    window.location.reload();
  };

  return (
    <>
      <PageHeader
        title="الإعدادات"
        actions={
          <>
            {saved && (
              <span aria-live="polite" className="text-[12px] text-muted">
                تم الحفظ.
              </span>
            )}
            <Button size="sm" onClick={onSave} leadingIcon={<FloppyDisk size={15} />}>
              حفظ التغييرات
            </Button>
          </>
        }
      />

      <Grid>
        {/* ── the two that change how everything else READS ───────────────── */}
        <Panel span={6} title="اللغة والعملة" bodyClassName="flex flex-col gap-4">
          <p className="text-[12px] leading-relaxed text-subtle">
            العملة تُطبَّق على كل رقم في التطبيق. تغييرها لا يحوّل الأرقام المسجَّلة، فما
            سُجّل بعملة يبقى بها.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="العملة" htmlFor="currency">
              <Select
                id="currency"
                value={draft.currency}
                options={CURRENCIES}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
            </Field>
            <Field label="تنسيق الأرقام والتاريخ" htmlFor="locale">
              <Select
                id="locale"
                value={draft.locale}
                options={LOCALES}
                onChange={(e) => setDraft({ ...draft, locale: e.target.value })}
              />
            </Field>
            <Field label="اللغة" htmlFor="language">
              <Select
                id="language"
                value={draft.language}
                options={LANGUAGES}
                onChange={(e) => setDraft({ ...draft, language: e.target.value as "en" | "ar" })}
              />
            </Field>
          </div>
        </Panel>

        {/* ── appearance ─────────────────────────────────────────────────── */}
        <Panel span={3} title="المظهر" bodyClassName="flex flex-col gap-3">
          <Segmented
            aria-label="المظهر"
            options={THEME_OPTIONS}
            value={preference}
            onChange={setPreference}
          />
          <p className="text-[12px] leading-relaxed text-subtle">
            «تلقائي» يتبع إعداد جهازك. يُحفَظ فوراً، فلا يحتاج زر الحفظ.
          </p>
        </Panel>

        {/* ── where the targets went ─────────────────────────────────────── */}
        <Panel span={3} title="الأهداف" bodyClassName="flex h-full flex-col gap-3">
          <p className="text-[12px] leading-relaxed text-muted">
            انتقلت الأهداف إلى شاشتها: هدف للحساب، ولكل مندوب، ولمنتج إن أردت، دائم أو
            لشهر واحد. هدفك القديم منقول إليها كما هو.
          </p>
          <div className="mt-auto">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/targets">فتح الأهداف</Link>
            </Button>
          </div>
        </Panel>

        {/* ── the defaults that pre-fill a new product ────────────────────── */}
        <Panel span={6} title="التكاليف الافتراضية" bodyClassName="flex flex-col gap-4">
          <p className="text-[12px] leading-relaxed text-subtle">
            تُملأ تلقائياً في كل منتج جديد. لا تمسّ منتجاً موجوداً، فتعديلها هنا لا يغيّر
            كلفة شيء بعتَه.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="رسوم المنصّة" htmlFor="mp">
              <Input
                id="mp"
                type="number"
                trailing="%"
                value={draft.defaultCosts.marketplaceFeePercent || ""}
                onChange={(e) => setCost("marketplaceFeePercent", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="رسوم الدفع" htmlFor="pf">
              <Input
                id="pf"
                type="number"
                trailing="%"
                value={draft.defaultCosts.paymentFeePercent || ""}
                onChange={(e) => setCost("paymentFeePercent", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="رسوم الدفع (ثابتة)" htmlFor="pff">
              <Input
                id="pff"
                type="number"
                value={draft.defaultCosts.paymentFeeFixed || ""}
                onChange={(e) => setCost("paymentFeeFixed", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="الضريبة" htmlFor="tax">
              <Input
                id="tax"
                type="number"
                trailing="%"
                value={draft.defaultCosts.taxPercent || ""}
                onChange={(e) => setCost("taxPercent", parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </Panel>

        {/* ── the data itself, and the one destructive verb in the product ── */}
        <Panel span={6} title="البيانات" bodyClassName="flex flex-col gap-4">
          <p className="text-[12px] leading-relaxed text-muted">
            بياناتك مخزّنة محلياً في هذا المتصفّح وحده. لا خادم، ولا حساب، ولا نسخة عندنا
            — وهذا يعني أن النسخة الاحتياطية مسؤوليتك. اقرأ{" "}
            <Link href="/legal/privacy" className="font-bold text-accent hover:underline">
              سياسة الخصوصية
            </Link>{" "}
            و
            <Link href="/legal/terms" className="font-bold text-accent hover:underline">
              شروط الاستخدام
            </Link>
            .
          </p>
          {message && (
            <p
              aria-live="polite"
              className={cn(
                "text-[13px]",
                message.tone === "success" ? "text-success" : "text-danger",
              )}
            >
              {message.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<DownloadSimple size={15} />}
              onClick={downloadBackup}
            >
              تنزيل نسخة احتياطية
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<UploadSimple size={15} />}
              onClick={() => fileRef.current?.click()}
            >
              استعادة نسخة
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onRestoreFile(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-auto border-t border-line pt-3">
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Warning size={15} />}
              onClick={() => setConfirmReset(true)}
            >
              تصفير كل البيانات
            </Button>
          </div>
        </Panel>
      </Grid>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="تصفير كل البيانات؟"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={onReset}>
              تصفير الكل
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          لا يمكن التراجع. يُفضّل تنزيل نسخة احتياطية أولًا.
        </p>
      </Dialog>
    </>
  );
}
