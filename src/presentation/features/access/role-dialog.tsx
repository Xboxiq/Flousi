"use client";

import { useState } from "react";
import {
  AccessPolicy,
  CAPABILITIES,
  CAPABILITY_LABELS,
  CAPABILITY_NOTES,
  type Capability,
  type Role,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { Button, Dialog, Field, Input, Textarea } from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";

/**
 * Creating or editing a role: the capability matrix, one switch per line.
 *
 * Every line says what it MEANS in this product («يرى تكاليف الشراء والهامش»), not
 * what it is called in the code. A merchant granting «viewCosts» has been told
 * nothing; a merchant granting «يرى تكاليف الشراء والهامش» has made a decision.
 */
export function RoleDialog({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  /** Null when creating. */
  role: Role | null;
}) {
  const createRole = useDataStore((s) => s.createRole);
  const updateRole = useDataStore((s) => s.updateRole);

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [granted, setGranted] = useState<Set<Capability>>(
    () => new Set(AccessPolicy.sanitise(role?.capabilities ?? [])),
  );
  const [busy, setBusy] = useState(false);

  const toggle = (capability: Capability) =>
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(capability)) next.delete(capability);
      else next.add(capability);
      return next;
    });

  const onSave = async () => {
    if (busy || name.trim() === "") return;
    setBusy(true);
    try {
      const patch = {
        name: name.trim(),
        description: description.trim() || undefined,
        capabilities: AccessPolicy.sanitise([...granted]),
        status: "active" as const,
      };
      if (role) await updateRole(role.id, patch);
      else await createRole(patch);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={role ? `تعديل دور «${role.name}»` : "دور جديد"}
      description={`صلاحيات ممنوحة: ${granted.size} من ${CAPABILITIES.length}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button onClick={onSave} disabled={busy || name.trim() === ""}>
            حفظ
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="اسم الدور" htmlFor="role-name">
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مندوب بغداد…"
          />
        </Field>
        <Field label="وصف قصير" htmlFor="role-desc" helper="يظهر تحت الاسم في هذه الشاشة.">
          <Textarea
            id="role-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <fieldset className="flex flex-col">
          <legend className="pb-2 text-sm font-semibold text-fg">ما يستطيعه هذا الدور</legend>
          {CAPABILITIES.map((capability) => {
            const on = granted.has(capability);
            const note = CAPABILITY_NOTES[capability];
            return (
              <label
                key={capability}
                /* label + control share ONE hit target, so the whole row is the
                   switch rather than a 16px box beside a sentence. */
                className="flex cursor-pointer items-start gap-3 border-b border-border-soft py-3 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(capability)}
                  className="mt-0.5 size-[18px] shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0">
                  <span className={cn("block text-sm", on ? "font-medium text-fg" : "text-muted")}>
                    {CAPABILITY_LABELS[capability]}
                  </span>
                  {note && <span className="mt-0.5 block text-xs text-subtle">{note}</span>}
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>
    </Dialog>
  );
}
