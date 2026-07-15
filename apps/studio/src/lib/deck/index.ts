// SP Deck Engine — public surface
export { buildDeckModel, TEMPLATE_IDS, SLIDE_IDS } from "./deck-model";
export type { DeckModel, DeckOptions, DeckSource, SlideId, TemplateId } from "./deck-model";
export { renderDeck } from "./render";
export { THEMES } from "./themes";
export { ADDON_CATALOG, ADDON_GROUPS, TARGET_TOTAL } from "./catalog";
export { fetchRemoteCatalog } from "./catalog-remote";
export type { CatalogBundle } from "./catalog-remote";
