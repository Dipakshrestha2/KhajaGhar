import { prisma } from "@/lib/db";

// ============================================================================
// PLATFORM SETTINGS DEFAULTS
// ============================================================================

const DEFAULTS: Record<string, { value: string; label: string; type: string; group: string }> = {
  platformName: { value: "KhajaGhar", label: "Platform Name", type: "string", group: "general" },
  currency: { value: "NPR", label: "Currency", type: "string", group: "general" },
  taxPercentage: { value: "13", label: "Tax Percentage (%)", type: "number", group: "pricing" },
  serviceFeePercentage: { value: "5", label: "Service Fee (%)", type: "number", group: "pricing" },
  baseDeliveryFee: { value: "50", label: "Base Delivery Fee", type: "number", group: "delivery" },
  perKmDeliveryFee: { value: "15", label: "Per KM Delivery Fee", type: "number", group: "delivery" },
  minimumOrderValue: { value: "200", label: "Minimum Order Value", type: "number", group: "general" },
  maximumDeliveryRadius: { value: "15", label: "Maximum Delivery Radius (km)", type: "number", group: "delivery" },
  platformCommission: { value: "15", label: "Platform Commission (%)", type: "number", group: "pricing" },
};

// ============================================================================
// GET SETTING
// ============================================================================

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.platformSettings.findUnique({ where: { key } });
  if (setting) return setting.value;
  return DEFAULTS[key]?.value ?? "";
}

export async function getNumericSetting(key: string): Promise<number> {
  const value = await getSetting(key);
  return parseFloat(value) || 0;
}

// ============================================================================
// GET ALL SETTINGS
// ============================================================================

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.platformSettings.findMany();
  const result: Record<string, string> = {};
  
  // Start with defaults
  for (const [key, def] of Object.entries(DEFAULTS)) {
    result[key] = def.value;
  }
  
  // Override with stored values
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  
  return result;
}

// ============================================================================
// UPDATE SETTING
// ============================================================================

export async function updateSetting(key: string, value: string): Promise<void> {
  const def = DEFAULTS[key];
  await prisma.platformSettings.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      label: def?.label ?? key,
      type: def?.type ?? "string",
      group: def?.group ?? "general",
    },
  });
}

export async function updateSettings(settings: Record<string, string>): Promise<void> {
  const operations = Object.entries(settings).map(([key, value]) =>
    updateSetting(key, value)
  );
  await Promise.all(operations);
}

export { DEFAULTS as SETTING_DEFAULTS };
