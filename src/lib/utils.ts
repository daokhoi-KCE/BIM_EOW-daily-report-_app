export const todayStr = () => new Date().toISOString().slice(0, 10);

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function delayMinutes(planned: string, actual: string): number | null {
  if (!planned || !actual) return null;
  const [ph, pm] = planned.split(":").map(Number);
  const [ah, am] = actual.split(":").map(Number);
  if ([ph, pm, ah, am].some((n) => Number.isNaN(n))) return null;
  let diff = ah * 60 + am - (ph * 60 + pm);
  if (diff < -600) diff += 1440; // qua ngày hôm sau, hiếm nhưng phòng trường hợp
  return diff;
}
