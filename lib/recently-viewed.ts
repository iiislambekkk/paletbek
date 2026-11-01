export type RecentItem = { id: string; name: string };

type RecentHistory = { products: RecentItem[]; pallets: RecentItem[] };

const storageKey = "paletbek:recently-viewed";
const emptyHistory: RecentHistory = { products: [], pallets: [] };

export function getRecentlyViewed(): RecentHistory {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!value || !Array.isArray(value.products) || !Array.isArray(value.pallets)) return emptyHistory;
    return {
      products: value.products.filter(isRecentItem).slice(0, 5),
      pallets: value.pallets.filter(isRecentItem).slice(0, 5),
    };
  } catch {
    return emptyHistory;
  }
}

function isRecentItem(value: unknown): value is RecentItem {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "string" &&
    "name" in value && typeof value.name === "string";
}

export function rememberViewed(kind: keyof RecentHistory, item: RecentItem) {
  try {
    const history = getRecentlyViewed();
    history[kind] = [item, ...history[kind].filter((entry) => entry.id !== item.id)].slice(0, 5);
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // Storage can be unavailable in private browsing or restricted environments.
  }
}
