import type { Clock, IdGenerator } from "@/domain";

export const systemClock: Clock = {
  now: () => new Date(),
};

export const uuidGenerator: IdGenerator = {
  generate: () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
};
