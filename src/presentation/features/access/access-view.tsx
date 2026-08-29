"use client";

import { useMemo, useState } from "react";
import {
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
  type Role,
} from "@/domain";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";
import { PageHeader } from "@/presentation/components/layout/page-header";
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Skeleton,
} from "@/presentation/components/ui";
import { Grid, Panel, Toolbar, Metric, Chip, Disclose } from "@/presentation/components/structure";
import { cn } from "@/presentation/lib/cn";
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

  const activeReps = useMemo(() => reps.filter((r) => r.status === "active"), [reps]);

  if (!loaded) {
    return (
      <>
        <PageHeader title="الأدوار والوصول" />
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
        actions={
          <Button size="sm" leadingIcon={<Plus size={15} />} onClick={() => setCreating(true)}>
            دور جديد
          </Button>
        }
      />

      <Grid>
        {/* ── the claim that must be read before anything else here (P3/G0) ──
            It stays a full sentence at rest rather than a latch: this is the one
            screen a merchant opens in order to hand a device to somebody else, and
            «this is not a login» is not a detail to discover on a second visit. */}
        <Panel span={6} title="ما الذي يضبطه الدور">
          {/* The claim stands; the reasoning opens. It is the sentence a merchant
              must not miss on the screen he uses to hand a device to someone else,
              and four clauses of justification at rest is a paragraph nobody reads
              before doing the thing it is warning about (VISUAL-LAW §15). */}
          <Disclose
            claim="هذه أوضاع عرض على هذا الجهاز، وليست حسابات دخول."
            hint="ما الذي يضبطه الدور، وما لا يضبطه."
          >
            <p className="text-[13px] leading-relaxed text-muted">
              رِتم يعمل كله داخل متصفّحك بلا خادم، ومن يحمل الجهاز يستطيع قراءة المخزَّن
              فيه. فالدور يضبط ما يُعرَض وما يُسمَح به، وهو تنظيم حقيقي ونافع: تُعطي
              مندوبك جهازاً يفتح على صفحته وحدها، وتُبعد أسعار الشراء عن شاشة مشتركة،
              وتمنع نقرة خاطئة على «إغلاق الشهر».
            </p>
            <p className="text-[13px] leading-relaxed text-muted">
              لكنه لا يحمي البيانات من شخص يملك الجهاز ويعرف ما يفعل. ورمز الرجوع
              يُخزَّن كبصمة مشفَّرة لا كأرقام، وهذا يمنع قراءته بنظرة على المخزَّن، لا
              أكثر.
            </p>
          </Disclose>
        </Panel>

        {/* ── the mode this device is in right now ────────────────────────── */}
        <Panel span={3} title="وضع هذا الجهاز" bodyClassName="flex flex-col gap-3">
          <Metric
            size="sm"
            amount={access.role.name}
            name={
              access.isOwner
                ? "بلا قيود"
                : `${AccessPolicy.sanitise(access.role.capabilities).length} صلاحية من ${CAPABILITIES.length}`
            }
          />
          {!access.isOwner && (
            <p className="text-[12px] leading-relaxed text-muted">
              ما لا يسمح به هذا الوضع لا يظهر أصلاً: القائمة الجانبية نفسها مُصفّاة، فلا
              يقود زر إلى رفض.
            </p>
          )}
        </Panel>

        {/* ── the return code: the one decision on this screen ────────────── */}
        <Panel
          span={3}
          accent={!pinSet}
          title="رمز الرجوع"
          bodyClassName="flex h-full flex-col gap-3"
        >
          <p className="text-[13px] leading-relaxed text-muted">
            {pinSet
              ? "الرجوع إلى وضع المالك يطلب الرمز، فلا يعود مندوب إلى شاشتك بنقرة."
              : "لا رمز محدَّد، فالرجوع إلى وضع المالك بنقرة واحدة. حدّده قبل أن تسلّم الجهاز."}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <Button
              variant={pinSet ? "secondary" : "primary"}
              size="sm"
              leadingIcon={pinSet ? <Lock size={15} /> : <LockOpen size={15} />}
              onClick={() => setPinOpen(true)}
            >
              {pinSet ? "تغيير الرمز" : "تحديد رمز"}
            </Button>
            {pinSet && (
              <Button variant="ghost" size="sm" onClick={() => void setPin(null)}>
                إزالة
              </Button>
            )}
          </div>
        </Panel>

        {/* ── the work: every role ─────────────────────────────────────────── */}
        <Panel
          span={12}
          bare
          footer={
            <span className="text-[11px] text-subtle">
              دور المالك ثابت: هو طريق الرجوع دائماً، فلا يُعدَّل ولا يُحذف.
            </span>
          }
        >
          <Toolbar title="الأدوار">
            <span className="r-spacer" />
          </Toolbar>
          <div className="r-tablewrap">
            <table className="r-tbl">
              <thead>
                <tr>
                  <th>الدور</th>
                  <th className="hidden md:table-cell">ماذا يرى</th>
                  <th className="w-[22%] min-w-[130px]">الصلاحيات</th>
                  <th />
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>
        </Panel>
      </Grid>

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

/**
 * One role, as a table row.
 *
 * The capability chips are gone. Every role printed its whole permission list as
 * seven or eight pills that restated the count sitting two lines above them — a
 * wall of badges that made three roles look like thirty facts, and that nobody
 * reads word by word. What a role IS gets one sentence in its own column; the
 * exact matrix lives in the edit sheet, where it is a set of switches you act on
 * rather than a list you scan.
 */
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
  const share = CAPABILITIES.length > 0 ? granted / CAPABILITIES.length : 0;

  return (
    <tr data-row>
      <td>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-fg">{role.name}</span>
          {active && <Chip tone="accent" className="h-[18px] text-[10px]">الوضع الحالي</Chip>}
          {owner && <Chip className="h-[18px] text-[10px]">ثابت</Chip>}
        </span>
      </td>
      <td className="hidden max-w-[46ch] whitespace-normal py-2 text-muted md:table-cell">
        {role.description ?? "—"}
      </td>
      <td>
        <span className="flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <i
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share > 0 ? 4 : 0, share * 100)}%`,
                background: owner ? "var(--accent-fill)" : "var(--series-3)",
              }}
            />
          </span>
          <bdi className="r-num w-[4.5rem] shrink-0 text-end text-[11px] text-subtle">
            {granted} / {CAPABILITIES.length}
          </bdi>
        </span>
      </td>
      <td className="text-end">
        <span className="flex flex-wrap items-center justify-end gap-1">
          {!active && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<UserSwitch size={14} />}
              onClick={onSwitch}
            >
              استخدم
            </Button>
          )}
          {editable && (
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`تعديل ${role.name}`}
                leadingIcon={<PencilSimple size={14} />}
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
        </span>
      </td>
    </tr>
  );
}

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
