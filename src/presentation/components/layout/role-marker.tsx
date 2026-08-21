"use client";

import { useState } from "react";
import { UserSwitch } from "@phosphor-icons/react";
import { Button, Dialog, Field, Input } from "@/presentation/components/ui";
import { useDataStore } from "@/presentation/stores/data-store";
import { useAccess } from "@/presentation/hooks/use-access";

/**
 * Says which role the device is in, at all times, with the way back (gate P3/G7).
 *
 * Silent on the owner's own session — a permanent badge saying «المالك» would be
 * noise on the only session that is not restricted. It appears exactly when
 * something IS restricted, which is when a merchant needs to be told: one who forgot
 * he is in rep view and concludes his sales collapsed is a bug we shipped.
 */
export function RoleMarker() {
  const access = useAccess();
  const reps = useDataStore((s) => s.reps);
  const pinSet = useDataStore((s) => s.pinSet);
  const returnToOwner = useDataStore((s) => s.returnToOwner);

  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  if (access.isOwner) return null;

  const boundRep = access.repId ? reps.find((r) => r.id === access.repId) : undefined;

  const leave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await returnToOwner(pin);
      if (!ok) {
        setWrong(true);
        return;
      }
      setOpen(false);
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  const onPress = () => {
    // No PIN set means the way back is unconditional, so it takes one press rather
    // than a sheet that asks for nothing.
    if (!pinSet) {
      void returnToOwner();
      return;
    }
    setWrong(false);
    setPin("");
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onPress}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-accent/35 bg-accent-soft px-3 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft/70"
      >
        <UserSwitch size={15} weight="bold" />
        <span className="max-w-[9rem] truncate">
          {access.role.name}
          {boundRep ? ` · ${boundRep.name}` : ""}
        </span>
        <span className="hidden font-medium text-accent/75 sm:inline">رجوع للمالك</span>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="الرجوع إلى وضع المالك"
        description="أدخل رمز المالك للرجوع."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              إلغاء
            </Button>
            <Button onClick={leave} disabled={busy || pin === ""}>
              رجوع
            </Button>
          </>
        }
      >
        <Field label="الرمز" htmlFor="owner-pin" error={wrong ? "الرمز غير صحيح." : undefined}>
          <Input
            id="owner-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            invalid={wrong}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setWrong(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && void leave()}
          />
        </Field>
      </Dialog>
    </>
  );
}
