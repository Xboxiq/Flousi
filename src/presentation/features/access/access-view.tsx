"use client";

import { useMemo, useState } from "react";
import {
  IdentificationBadge,
  Lock,
  LockOpen,
  PencilSimple,
  Plus,
  Trash,
  UserSwitch,
} from "@phosphor-icons/react";
import {
  AccessPolicy,
  CAPABILITIES,
  CAPABILITY_LABELS,
  isOwnerRole,
  type Capability,
  type Role,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  Field,
  Input,
  Select,
  Skeleton,
} from "@/presentation/components/ui";
import { cn } from "@/presentation/lib/cn";
import { Ladder, Rung } from "@/presentation/features/dashboard/ladder";
import { RoleDialog } from "./role-dialog";

/**
 * «الأدوار والوصول» — the screen the merchant runs his organisation from.
 *
 * The honest framing is on the screen itself, not buried in a doc (gate P3/G0):
 * this decides what the app SHOWS and ALLOWS on this device. It is not
 * authentication. Everything lives in one browser's storage, which anyone holding
 * the device can read, so a PIN here is a speed bump and saying otherwise in a
 * product about honest numbers would be the one unforgivable lie.
 */
export function AccessView() {
  const loaded = useDataStore((s) => s.loaded);
  const roles = useDataStore((s) => s.roles);
  const reps = useDataStore((s) => s.reps);
  const pinSet = useDataStore((s) => s.pinSet);
  const deleteRole = useDataStore((s) => s.deleteRole);
  const switchRole = useDataStore((s) => s.switchRole);
  const setPin = useDataStore((s) => s.setPin);
  const access = useAccess();

  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<Role | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const activeReps = useMemo(() => reps.filter((r) => r.status === "active"), [reps]);

  if (!loaded) {
    return (
      <>
        <PageHeader title="الأدوار والوصول" description="من يستخدم هذا الجهاز، وماذا يرى." />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-32 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-80 rounded-[var(--radius-2xl)]" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الأدوار والوصول"
        description={`أدوار: ${roles.length} · وضعك الحالي: ${access.role.name}`}
        actions={
          <Button leadingIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
            دور جديد
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {/* The claim that must be read before anything else on this screen (gate
            P3/G0) IS the latch: a closed rung states its own answer, so the sentence
            is at rest in bold and the four clauses of reasoning behind it are one tap
            away, word for word. It used to be a five-clause paragraph in a bordered
            note, on the screen a merchant opens in order to hand a device to someone
            else (VISUAL-LAW §15). */}
        <Ladder solo>
          <Rung
            title="هذه أوضاع عرض على هذا الجهاز، وليست حسابات دخول"
            hint="ما الذي يضبطه الدور، وما لا يضبطه."
            open={whyOpen}
            onToggle={() => setWhyOpen((v) => !v)}
          >
            <p className="max-w-[68ch] text-sm leading-relaxed text-muted">
              فلوسي يعمل كله داخل متصفّحك بلا خادم، ومن يحمل الجهاز يستطيع قراءة المخزَّن فيه.
              فالدور يضبط ما يُعرَض وما يُسمَح به، وهو تنظيم حقيقي ونافع: تُعطي مندوبك جهازاً
              يفتح على صفحته وحدها، وتُبعد أسعار الشراء عن شاشة مشتركة، وتمنع نقرة خاطئة على
              «إغلاق الشهر». لكنه لا يحمي البيانات من شخص يملك الجهاز ويعرف ما يفعل.
            </p>
            <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-muted">
              ورمز الرجوع يُخزَّن كبصمة مشفَّرة لا كأرقام، وهذا يمنع قراءته بنظرة على المخزَّن،
              لا أكثر.
            </p>
          </Rung>
        </Ladder>

        {/* One line and one verb, so it is one ROW and not a card with a void where
            the paragraph used to be: shortening the copy without shortening the box
            just moves the noise into empty space (VISUAL-LAW §10). */}
        <Card>
          <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>رمز الرجوع</CardTitle>
              <CardDescription>
                {pinSet
                  ? "الرجوع إلى وضع المالك يطلب الرمز."
                  : "لا رمز محدَّد، فالرجوع إلى وضع المالك بنقرة واحدة."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={pinSet ? <Lock size={16} /> : <LockOpen size={16} />}
                onClick={() => setPinOpen(true)}
              >
                {pinSet ? "تغيير الرمز" : "تحديد رمز"}
              </Button>
              {pinSet && (
                <Button variant="ghost" size="sm" onClick={() => void setPin(null)}>
                  إزالة الرمز
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الأدوار</CardTitle>
              <CardDescription>
                دور المالك ثابت: هو طريق الرجوع دائماً.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {roles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  active={role.id === access.role.id}
                  onEdit={() => setEditing(role)}
                  onDelete={() => setConfirmDelete(role)}
                  onSwitch={() => setSwitching(role)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <RoleDialog
        key={editing?.id ?? (creating ? "new" : "closed")}
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        role={editing}
      />

      <SwitchDialog
        key={switching?.id ?? "none"}
        role={switching}
        reps={activeReps}
        onClose={() => setSwitching(null)}
        onConfirm={async (repId) => {
          if (!switching) return;
          await switchRole(switching.id, repId);
          setSwitching(null);
        }}
      />

      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete ? `حذف دور «${confirmDelete.name}»؟` : ""}
        description="لن يتأثر أي مندوب ولا أي بيعة. الحذف يزيل الدور فقط."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return;
                await deleteRole(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              حذف
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          إن كان الجهاز يعمل بهذا الدور الآن، فسيرجع إلى وضع المالك فوراً بدلاً من أن يبقى بلا
          صلاحيات.
        </p>
      </Dialog>

      <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} onSave={setPin} />
    </>
  );
}

function RoleRow({
  role,
  active,
  onEdit,
  onDelete,
  onSwitch,
}: {
  role: Role;
  active: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSwitch: () => void;
}) {
  const owner = isOwnerRole(role);
  const editable = AccessPolicy.isEditable(role);
  const granted = owner ? CAPABILITIES.length : AccessPolicy.sanitise(role.capabilities).length;

  return (
    <li
      data-row
      className="flex flex-col gap-3 border-b border-border-soft py-4 last:border-b-0 sm:flex-row sm:items-start"
    >
      <span className="squircle size-10 shrink-0 text-muted" aria-hidden>
        <IdentificationBadge size={19} weight="bold" />
      </span>

      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-fg">{role.name}</span>
          {active && <Badge tone="accent">الوضع الحالي</Badge>}
          {owner && <Badge tone="neutral">ثابت</Badge>}
        </span>
        {role.description && (
          <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-muted">{role.description}</p>
        )}
        <p className="mt-1.5 text-xs text-subtle">
          صلاحيات: {granted} من {CAPABILITIES.length}
          {owner ? " (كلها)" : ""}
        </p>
        {!owner && granted > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {AccessPolicy.sanitise(role.capabilities).map((c: Capability) => (
              <li
                key={c}
                className="rounded-full border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
              >
                {CAPABILITY_LABELS[c]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {!active && (
          <Button variant="secondary" size="sm" leadingIcon={<UserSwitch size={15} />} onClick={onSwitch}>
            استخدم هذا الوضع
          </Button>
        )}
        {editable && (
          <>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`تعديل ${role.name}`}
              leadingIcon={<PencilSimple size={15} />}
              onClick={onEdit}
            >
              تعديل
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`حذف ${role.name}`}
              onClick={onDelete}
            >
              <Trash size={15} />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Switching in. A role without `viewAllSales` MUST be bound to a rep, otherwise the
 * session sees nobody's sales — the policy's honest answer, but a confusing screen.
 * The sheet refuses to switch until a rep is chosen.
 */
function SwitchDialog({
  role,
  reps,
  onClose,
  onConfirm,
}: {
  role: Role | null;
  reps: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: (repId?: string) => Promise<void>;
}) {
  const [repId, setRepId] = useState("");
  const [busy, setBusy] = useState(false);

  const capabilities = role ? AccessPolicy.sanitise(role.capabilities) : [];
  const needsRep = role ? !isOwnerRole(role) && !capabilities.includes("viewAllSales") : false;
  const blocked = needsRep && repId === "";

  return (
    <Dialog
      open={role !== null}
      onClose={onClose}
      title={role ? `استخدام وضع «${role.name}»` : ""}
      description="يبدّل هذا الجهاز فقط. تعود إلى وضع المالك من العلامة أعلى الشاشة."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            disabled={busy || blocked}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(repId || undefined);
              } finally {
                setBusy(false);
              }
            }}
          >
            تبديل
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {needsRep ? (
          <Field
            label="بوصف أي مندوب؟"
            htmlFor="switch-rep"
            helper="هذا الدور لا يرى مبيعات المتجر كلها، فيُربط بمندوب واحد ويرى عمله وحده."
          >
            <Select
              id="switch-rep"
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
              options={[
                { label: "اختر مندوباً…", value: "" },
                ...reps.map((r) => ({ label: r.name, value: r.id })),
              ]}
            />
          </Field>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            هذا الدور يرى مبيعات المتجر كلها، فلا يُربط بمندوب معيّن.
          </p>
        )}

        {role && !isOwnerRole(role) && (
          <div className="rounded-[var(--radius-md)] border border-border-soft bg-sunken p-3">
            <p className="text-xs font-semibold text-fg">ما سيُخفى في هذا الوضع</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {CAPABILITIES.filter((c) => !capabilities.includes(c)).map((c) => (
                <li key={c} className="text-xs text-muted">
                  {CAPABILITY_LABELS[c]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function PinDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (pin: string | null) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const mismatch = again !== "" && pin !== again;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="رمز الرجوع إلى وضع المالك"
      description="أرقام تحفظها. تُخزَّن بصمتها لا هي."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            disabled={busy || pin === "" || mismatch || again === ""}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(pin);
                setPin("");
                setAgain("");
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            حفظ الرمز
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="الرمز" htmlFor="pin-1">
          <Input
            id="pin-1"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </Field>
        <Field
          label="أعِد الرمز"
          htmlFor="pin-2"
          error={mismatch ? "الرمزان غير متطابقين." : undefined}
        >
          <Input
            id="pin-2"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            invalid={mismatch}
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
        </Field>
        <p className={cn("text-xs leading-relaxed text-subtle")}>
          نسيان الرمز لا يقفل بياناتك: تفريغ بيانات الموقع من إعدادات المتصفّح يعيد الجهاز إلى
          وضع المالك، لأن هذا وضع عرض لا قفل أمان.
        </p>
      </div>
    </Dialog>
  );
}
