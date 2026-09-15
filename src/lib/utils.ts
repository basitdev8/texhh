export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TH-${timestamp}-${random}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getDiscountPercentage(price: number, comparePrice: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Escape user input before using it in a MongoDB $regex / RegExp so a
// crafted pattern can't cause catastrophic backtracking (ReDoS).
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getProductSignalRail(specifications?: Record<string, string>): string | null {
  if (!specifications || typeof specifications !== "object") return null;
  const entries = Object.entries(specifications).filter(
    ([, v]) => Boolean(v) && typeof v === "string" && v.trim().length > 0
  );
  if (entries.length === 0) return null;

  const priorityGroups = [
    ["display", "screen", "panel"],
    ["processor", "cpu", "chip", "chipset", "gpu"],
    ["ram", "memory"],
    ["storage", "ssd", "capacity", "size"],
    ["connectivity", "wireless", "network", "5g", "bluetooth"],
    ["battery", "power", "wattage", "psu"],
    ["socket", "form factor", "formfactor"],
  ];

  const matchedValues: string[] = [];
  const usedKeys = new Set<string>();

  for (const group of priorityGroups) {
    for (const [k, v] of entries) {
      const lowerKey = k.toLowerCase();
      if (!usedKeys.has(lowerKey) && group.some((term) => lowerKey.includes(term))) {
        matchedValues.push(v.trim());
        usedKeys.add(lowerKey);
        break;
      }
    }
    if (matchedValues.length >= 3) break;
  }

  if (matchedValues.length === 0) {
    for (const [, v] of entries.slice(0, 3)) {
      matchedValues.push(v.trim());
    }
  }

  if (matchedValues.length === 0) return null;
  return matchedValues.slice(0, 3).join(" · ");
}

