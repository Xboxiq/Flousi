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

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP"].map((c) => ({ label: c, value: c }));
const LOCALES = [
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Arabic (Saudi Arabia)", value: "ar-SA" },
  { label: "Arabic (Egypt)", value: "ar-EG" },
];
const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "العربية", value: "ar" },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun size={16} /> },
  { value: "dark", label: "Dark", icon: <Moon size={16} /> },
  { value: "system", label: "System", icon: <Desktop size={16} /> },
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
      setMessage({ tone: "success", text: "Backup restored successfully." });
    } catch (err) {
      setMessage({
        tone: "danger",
        text: err instanceof Error ? err.message : "Could not restore backup.",
      });
    }
  };

  const onReset = () => {
    clearAll();
    window.location.reload();
  };

  return (
    <>
      <PageHeader title="Settings" description="Preferences, defaults and data management." />

      <div className="flex flex-col gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how Flousi looks.</CardDescription>
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
              <CardTitle>Localization</CardTitle>
              <CardDescription>Currency and language for the whole app.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Currency" htmlFor="currency">
              <Select
                id="currency"
                value={draft.currency}
                options={CURRENCIES}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
            </Field>
            <Field label="Number/date locale" htmlFor="locale">
              <Select
                id="locale"
                value={draft.locale}
                options={LOCALES}
                onChange={(e) => setDraft({ ...draft, locale: e.target.value })}
              />
            </Field>
            <Field label="Language" htmlFor="language">
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
              <CardTitle>Default costs</CardTitle>
              <CardDescription>Pre-filled into every new product to save time.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Marketplace fee" htmlFor="mp">
              <Input
                id="mp"
                type="number"
                trailing="%"
                value={draft.defaultCosts.marketplaceFeePercent || ""}
                onChange={(e) => setCost("marketplaceFeePercent", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Payment fee" htmlFor="pf">
              <Input
                id="pf"
                type="number"
                trailing="%"
                value={draft.defaultCosts.paymentFeePercent || ""}
                onChange={(e) => setCost("paymentFeePercent", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Payment fee (fixed)" htmlFor="pff">
              <Input
                id="pff"
                type="number"
                value={draft.defaultCosts.paymentFeeFixed || ""}
                onChange={(e) => setCost("paymentFeeFixed", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Tax" htmlFor="tax">
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
            Save changes
          </Button>
          {saved && <span className="text-sm text-success">Saved.</span>}
        </div>

        {/* Data management */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Data</CardTitle>
              <CardDescription>Your data is stored locally in this browser.</CardDescription>
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
                Download backup
              </Button>
              <Button
                variant="secondary"
                leadingIcon={<UploadSimple size={16} />}
                onClick={() => fileRef.current?.click()}
              >
                Restore backup
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
                Reset all data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        description="This deletes all products, sales and periods in this browser and restores the demo data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onReset}>
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This cannot be undone. Consider downloading a backup first.
        </p>
      </Dialog>
    </>
  );
}
