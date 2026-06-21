import dbConnect from "@/app/lib/mongodb";
import Settings from "@/app/models/Settings";
import { buildDeliveryTimeLabel, getOrderWindowStatus, normalizeTime24h } from "@/app/lib/orderWindow";

export type NormalizedSettings = {
  key: string;
  businessEmail: string;
  businessPhone: string;
  deliveryCharge: number;
  deliveryTimeWindow: string;
  orderWindowStart: string;
  orderWindowEnd: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeSettingsDoc(raw: Record<string, unknown> | null | undefined): NormalizedSettings {
  const orderWindowStart = normalizeTime24h(raw?.orderWindowStart, "08:00");
  const orderWindowEnd = normalizeTime24h(raw?.orderWindowEnd, "00:00");
  const deliveryTimeWindow =
    typeof raw?.deliveryTimeWindow === "string" && raw.deliveryTimeWindow.trim()
      ? raw.deliveryTimeWindow.trim()
      : buildDeliveryTimeLabel(orderWindowStart, orderWindowEnd);

  return {
    key: "global",
    businessEmail: typeof raw?.businessEmail === "string" ? raw.businessEmail : "admin@myshop.com",
    businessPhone: typeof raw?.businessPhone === "string" ? raw.businessPhone : "+91 9876543210",
    deliveryCharge: typeof raw?.deliveryCharge === "number" ? raw.deliveryCharge : 40,
    deliveryTimeWindow,
    orderWindowStart,
    orderWindowEnd,
    createdAt: raw?.createdAt as Date | undefined,
    updatedAt: raw?.updatedAt as Date | undefined,
  };
}

/** Load global settings; backfill order-window fields on older DB documents. */
export async function getGlobalSettings(): Promise<NormalizedSettings> {
  await dbConnect();
  let raw = (await Settings.findOne({ key: "global" }).lean()) as Record<string, unknown> | null;

  if (!raw) {
    const created = await Settings.create({});
    raw = created.toObject() as unknown as Record<string, unknown>;
  }

  const normalized = normalizeSettingsDoc(raw);

  const needsPersist =
    raw.orderWindowStart !== normalized.orderWindowStart ||
    raw.orderWindowEnd !== normalized.orderWindowEnd ||
    raw.deliveryTimeWindow !== normalized.deliveryTimeWindow;

  if (needsPersist) {
    const updated = await Settings.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          orderWindowStart: normalized.orderWindowStart,
          orderWindowEnd: normalized.orderWindowEnd,
          deliveryTimeWindow: normalized.deliveryTimeWindow,
        },
      },
      { new: true }
    ).lean();
    if (updated) {
      return normalizeSettingsDoc(updated as Record<string, unknown>);
    }
  }

  return normalized;
}

export async function getOrderWindowFromSettings(now = new Date()) {
  const settings = await getGlobalSettings();
  return getOrderWindowStatus(settings.orderWindowStart, settings.orderWindowEnd, now);
}
