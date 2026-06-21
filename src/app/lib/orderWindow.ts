/** Store operates in Indore — order-window times are always interpreted in IST. */
export const STORE_TIMEZONE = "Asia/Kolkata";

/** Current clock time in a timezone as minutes since midnight (0–1439). */
export function getMinutesInTimezone(now: Date, timeZone = STORE_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  if (hour === 24) hour = 0;
  return hour * 60 + minute;
}

/** Parse "HH:MM" (24h) to minutes since midnight. */
export function timeStringToMinutes(value: string): number | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Normalize browser / DB time to "HH:MM" for `<input type="time">` and storage. */
export function normalizeTime24h(value: unknown, fallback = "08:00"): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const mins = timeStringToMinutes(value.trim());
  if (mins === null) return fallback;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format "08:00" → "8:00 AM", "00:00" → "12:00 AM (midnight)". */
export function formatTime12h(value: string): string {
  const mins = timeStringToMinutes(value);
  if (mins === null) return value;
  if (value === "00:00") return "12:00 AM (midnight)";

  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function buildDeliveryTimeLabel(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

export type Time12hParts = {
  hour: number;
  minute: number;
  period: "AM" | "PM";
};

/** "23:59" → { hour: 11, minute: 59, period: "PM" } */
export function time24hTo12hParts(value: string): Time12hParts {
  const mins = timeStringToMinutes(normalizeTime24h(value)) ?? 0;
  const h24 = Math.floor(mins / 60);
  const minute = mins % 60;
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute, period };
}

/** 11 + 59 + PM → "23:59" */
export function time12hPartsTo24h(hour12: number, minute: number, period: "AM" | "PM"): string {
  const h = Math.min(12, Math.max(1, Math.floor(hour12)));
  const m = Math.min(59, Math.max(0, Math.floor(minute)));
  let h24: number;
  if (period === "AM") {
    h24 = h === 12 ? 0 : h;
  } else {
    h24 = h === 12 ? 12 : h + 12;
  }
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Fixes a common admin mistake: end saved as 11:59 meaning 11:59 PM but stored as 11:59 (AM).
 * Only applies when start is morning and end is 11:00–11:59 (24h).
 */
export function resolveEndMinutes(startMin: number, endMin: number): number {
  if (endMin === 0 && startMin > 0) return 24 * 60;

  if (
    startMin >= 6 * 60 &&
    endMin >= 11 * 60 &&
    endMin < 12 * 60 &&
    endMin > startMin
  ) {
    return endMin + 12 * 60;
  }

  return endMin;
}

/** Normalize stored end time (handles 11:59 AM → 11:59 PM when paired with morning start). */
export function normalizeOrderWindowEnd24h(start24: string, end24: string): string {
  const startMin = timeStringToMinutes(normalizeTime24h(start24)) ?? 8 * 60;
  const rawEndMin = timeStringToMinutes(normalizeTime24h(end24)) ?? 0;
  const resolved = resolveEndMinutes(startMin, rawEndMin);
  if (resolved >= 24 * 60) return "00:00";
  return `${String(Math.floor(resolved / 60)).padStart(2, "0")}:${String(resolved % 60).padStart(2, "0")}`;
}

export type OrderWindowStatus = {
  isOpen: boolean;
  start: string;
  end: string;
  label: string;
};

/**
 * Whether customers can place orders right now.
 * Default: 8:00 AM – 12:00 AM (midnight). End "00:00" with start > 0 means end of day.
 */
export function getOrderWindowStatus(
  start = "08:00",
  end = "00:00",
  now = new Date()
): OrderWindowStatus {
  const startMin = timeStringToMinutes(normalizeTime24h(start)) ?? 8 * 60;
  let endMin = resolveEndMinutes(startMin, timeStringToMinutes(normalizeTime24h(end)) ?? 0);

  const nowMin = getMinutesInTimezone(now);
  let isOpen: boolean;

  if (startMin < endMin) {
    // Inclusive end minute — "closes at 11:59 PM" includes 11:59 PM
    isOpen = nowMin >= startMin && nowMin <= endMin;
  } else if (startMin === endMin) {
    isOpen = true;
  } else {
    isOpen = nowMin >= startMin || nowMin <= endMin;
  }

  const resolvedEnd24 =
    endMin >= 24 * 60 ? "00:00" : `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

  return {
    isOpen,
    start: normalizeTime24h(start),
    end: resolvedEnd24,
    label: buildDeliveryTimeLabel(normalizeTime24h(start), resolvedEnd24),
  };
}

export function getOutsideOrderWindowMessage(status: OrderWindowStatus): string {
  return (
    `Your item was added to the cart successfully. We accept orders from ${formatTime12h(status.start)} to ${formatTime12h(status.end)}. ` +
    `Please place your order during this window — morning orders are delivered fresh. You can checkout when ordering hours begin.`
  );
}

export function getCheckoutBlockedMessage(status: OrderWindowStatus): string {
  return (
    `Ordering is currently closed. We accept orders from ${formatTime12h(status.start)} to ${formatTime12h(status.end)}. ` +
    `Please try again during ordering hours. Items in your cart are saved for when the window opens.`
  );
}
