"use client";

import { useState } from "react";
import type { Rep, RepStatus } from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Segmented, Textarea } from "@/presentation/components/ui";
import { REP_STATUS_LABELS } from "@/presentation/lib/labels";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Present = editing that rep; absent = adding a new one. */
  rep?: Rep;
}

const STATUS_OPTIONS = [
  { label: REP_STATUS_LABELS.active, value: "active" as RepStatus },
  { label: REP_STATUS_LABELS.archived, value: "archived" as RepStatus },
];

/**
 * Adding or editing a partner. Archiving is offered here as a status rather than
 * a delete, because history references a rep forever and an archived rep stays
 * payable — the repository has no `remove` at all.
 */
export function RepDialog({ open, onClose, rep }: Props) {
  const createRep = useDataStore((s) => s.createRep);
  const updateRep = useDataStore((s) => s.updateRep);

  const [name, setName] = useState(rep?.name ?? "");
  const [phone, setPhone] = useState(rep?.phone ?? "");
  const [notes, setNotes] = useState(rep?.notes ?? "");
  const [status, setStatus] = useState<RepStatus>(rep?.status ?? "active");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    // Validated on submit, never by a disabled key: a dead button explains nothing.
    if (!name.trim()) {
      setError("اكتب اسم المندوب.");
      return;
    }
    setSaving(true);
    try {
      const patch = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      };
      if (rep) await updateRep(rep.id, patch);
      else await createRep(patch);
      onClose();
      if (!rep) {
        setName("");
        setPhone("");
        setNotes("");
      }
      setError(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={rep ? "تعديل بيانات المندوب" : "إضافة مندوب"}
      description={
        rep
          ? "تغيير الاسم لا يمسّ حصصه المجمّدة، فكل عملية تحمل اسمه وقت تسجيلها."
          : "بعد إضافته يظهر في قائمة المندوبين عند تسجيل أي بيع."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={submit} loading={saving}>
            {rep ? "حفظ" : "إضافة"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم" htmlFor="rep-name" required error={error ?? undefined}>
          <Input
            id="rep-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="الهاتف" htmlFor="rep-phone">
          <Input
            id="rep-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
          />
        </Field>
        {/* a row of buttons is a group, and <label for> cannot name one — the
            label becomes a <span id> the group points at instead */}
        <Field label="الحالة" htmlFor="rep-status" labelsGroup className="sm:col-span-2">
          <Segmented
            id="rep-status"
            aria-labelledby="rep-status-label"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </Field>
        <Field label="ملاحظات" htmlFor="rep-notes" className="sm:col-span-2">
          <Textarea
            id="rep-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </Field>
      </div>
    </Dialog>
  );
}
