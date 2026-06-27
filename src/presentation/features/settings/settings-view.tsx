"use client";

import { useRef, useState } from "react";
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
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  Field,
  Input,
  Segmented,
  Select,
} from "@/presentation/components/ui";
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

export function SettingsView() {
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
      <PageHeader title="الإعدادات" description="التفضيلات والقيم الافتراضية وإدارة البيانات." />

      <div className="flex flex-col gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>المظهر</CardTitle>
              <CardDescription>اختر شكل فلوسي.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Segmented options={THEME_OPTIONS} value={preference} onChange={setPreference} />
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>اللغة والعملة</CardTitle>
              <CardDescription>العملة واللغة لكامل التطبيق.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="العملة" htmlFor="currency">
              <Select
                id="currency"
                value={draft.currency}
                options={CURRENCIES}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
            </Field>
            <Field label="تنسيق الأرقام/التاريخ" htmlFor="locale">
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
          </CardContent>
        </Card>

        {/* Default costs */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>التكاليف الافتراضية</CardTitle>
              <CardDescription>تُملأ تلقائيًا في كل منتج جديد لتوفير الوقت.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} leadingIcon={<FloppyDisk size={16} />}>
            حفظ التغييرات
          </Button>
          {saved && <span className="text-sm text-success">تم الحفظ.</span>}
        </div>

        {/* Data management */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>البيانات</CardTitle>
              <CardDescription>بياناتك مخزّنة محليًا في هذا المتصفّح.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {message && (
              <p
                className={cn(
                  "text-sm",
                  message.tone === "success" ? "text-success" : "text-danger",
                )}
              >
                {message.text}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                leadingIcon={<DownloadSimple size={16} />}
                onClick={downloadBackup}
              >
                تنزيل نسخة احتياطية
              </Button>
              <Button
                variant="secondary"
                leadingIcon={<UploadSimple size={16} />}
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
              <Button
                variant="ghost"
                leadingIcon={<Warning size={16} />}
                onClick={() => setConfirmReset(true)}
              >
                تصفير كل البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="تصفير كل البيانات؟"
        description="سيحذف هذا كل المنتجات والمبيعات والفترات في هذا المتصفّح ويعيد البيانات التجريبية."
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
