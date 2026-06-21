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
  const startMin = timeStringToMinutes(start) ?? 8 * 60;
  let endMin = timeStringToMinutes(end) ?? 0;
  if (endMin === 0 && startMin > 0) endMin = 24 * 60;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  let isOpen: boolean;

  if (startMin < endMin) {
    isOpen = nowMin >= startMin && nowMin < endMin;
  } else if (startMin === endMin) {
    isOpen = true;
  } else {
    isOpen = nowMin >= startMin || nowMin < endMin;
  }

  return {
    isOpen,
    start,
    end,
    label: buildDeliveryTimeLabel(start, end),
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
