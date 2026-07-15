// ============================================================
//  SP Deck Engine — Remote catalog client
//  apps/studio/src/lib/deck/catalog-remote.ts
//
//  Brainztem's GET /api/catalog is the source of truth for
//  add-on pricing (brainstem/src/lib/catalog.ts). This client
//  fetches and maps it into the deck engine's AddonItem shape,
//  with a short timeout and a module-level cache; any failure
//  returns null and callers fall back to the local stub in
//  ./catalog.ts (keep that mirror in sync when prices change).
//
//  Env:
//    BRAINZTEM_CATALOG_URL  override the endpoint (default prod)
//    SP_CATALOG_REMOTE=off  skip remote entirely (offline dev)
// ============================================================

import type { DimensionKey, StrategyTier } from "../types";
import { DIMENSION_KEYS } from "../types";
import type { AddonGroup, AddonGroupId, AddonItem } from "./catalog";

export interface CatalogBundle {
  items: AddonItem[];
  groups: AddonGroup[];
}

const DEFAULT_URL = "https://brainztem.com/api/catalog";
const FETCH_TIMEOUT_MS = 2_500;
const CACHE_TTL_MS = 10 * 60 * 1000;

const GROUP_IDS = new Set(["foundation", "growth", "authority", "ops"]);

let cache: { bundle: CatalogBundle | null; at: number } | null = null;

interface RemoteItem {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  priceUsd?: unknown;
  group?: unknown;
  targets?: unknown;
  mapsTo?: unknown;
  preselected?: unknown;
  tiers?: unknown;
}

function mapItem(raw: RemoteItem): AddonItem | null {
  if (
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.description !== "string" ||
    typeof raw.priceUsd !== "number" ||
    typeof raw.group !== "string" ||
    !GROUP_IDS.has(raw.group)
  ) {
    return null;
  }
  const targets = Array.isArray(raw.targets)
    ? raw.targets.filter((t): t is DimensionKey =>
        (DIMENSION_KEYS as readonly string[]).includes(String(t)),
      )
    : undefined;
  const tiers = Array.isArray(raw.tiers)
    ? raw.tiers.filter((t): t is StrategyTier => t === "standard" || t === "nonprofit")
    : undefined;
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    price: raw.priceUsd,
    group: raw.group as AddonGroupId,
    targets: targets?.length ? targets : undefined,
    mapsTo: typeof raw.mapsTo === "string" ? raw.mapsTo : "",
    preselected: raw.preselected === true,
    tiers: tiers?.length ? tiers : undefined,
  };
}

export async function fetchRemoteCatalog(): Promise<CatalogBundle | null> {
  if (process.env.SP_CATALOG_REMOTE === "off") return null;
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.bundle;

  const url = process.env.BRAINZTEM_CATALOG_URL ?? DEFAULT_URL;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`catalog fetch ${res.status}`);
    const data = (await res.json()) as { items?: RemoteItem[]; groups?: AddonGroup[] };

    const items = (data.items ?? []).map(mapItem).filter((i): i is AddonItem => i !== null);
    const groups = (data.groups ?? []).filter(
      (g) => g && GROUP_IDS.has(g.id) && typeof g.label === "string" && typeof g.blurb === "string",
    );
    const bundle = items.length && groups.length ? { items, groups } : null;
    cache = { bundle, at: Date.now() };
    if (!bundle) console.warn(`[catalog-remote] response from ${url} was empty/invalid — using local stub`);
    return bundle;
  } catch (e) {
    // Negative-cache failures briefly so an outage doesn't add a timeout to
    // every deck render.
    cache = { bundle: null, at: Date.now() };
    console.warn(`[catalog-remote] falling back to local stub: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}
